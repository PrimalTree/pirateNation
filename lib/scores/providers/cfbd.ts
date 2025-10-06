import { RawGame } from '../types.js';

function getWeek(date: Date, dowOffset: number) {
  dowOffset = typeof dowOffset == 'number' ? dowOffset : 0;
  const newYear = new Date(date.getFullYear(), 0, 1);
  let day = newYear.getDay() - dowOffset;
  day = day >= 0 ? day : day + 7;
  const daynum =
    Math.floor(
      (date.getTime() -
        newYear.getTime() -
        (date.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) /
        86400000
    ) + 1;
  let weeknum;
  if (day < 4) {
    weeknum = Math.floor((daynum + day - 1) / 7) + 1;
    if (weeknum > 52) {
      const nYear = new Date(date.getFullYear() + 1, 0, 1);
      let nday = nYear.getDay() - dowOffset;
      nday = nday >= 0 ? nday : nday + 7;
      weeknum = nday < 4 ? 1 : 53;
    }
  } else {
    weeknum = Math.floor((daynum + day - 1) / 7);
  }
  return weeknum;
}

export function cfbdProvider(apiKey: string, weatherKey?: string) {
  const BASE_URL = 'https://api.collegefootballdata.com';
  const AUTH_HEADER = `Bearer ${apiKey}`;

  async function getGamesByDate(dateISO: string, team?: string): Promise<RawGame[]> {
    const url = new URL(`${BASE_URL}/games`);
    const date = new Date(dateISO);
    url.searchParams.append('year', date.getFullYear().toString());
    url.searchParams.append('week', getWeek(date, 1).toString());
    url.searchParams.append('seasonType', 'regular');
    if (team) url.searchParams.append('team', team);

    const response = await fetch(url.toString(), {
      headers: { Authorization: AUTH_HEADER },
    });
    if (!response.ok) {
      throw new Error(`CFBD error: ${response.statusText}`);
    }
    const games = (await response.json()) as RawGame[];
    return games.filter(
      (game: RawGame) =>
        new Date(game.start_date).toISOString().substring(0, 10) === dateISO.substring(0, 10)
    );
  }

  async function getPregame(team: string) {
    const year = new Date().getFullYear();
    const url = new URL(`${BASE_URL}/games`);
    url.searchParams.append('year', year.toString());
    url.searchParams.append('seasonType', 'regular');
    url.searchParams.append('team', team);

    const res = await fetch(url.toString(), {
      headers: { Authorization: AUTH_HEADER },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`CFBD pregame error: ${res.status}`);
    const games = await res.json();

    const now = Date.now();
    const upcoming = games.find((g: any) => new Date(g.start_date).getTime() >= now);
    if (!upcoming) return null;

    const opponent =
      upcoming.away_team.toLowerCase() === team.toLowerCase()
        ? upcoming.home_team
        : upcoming.away_team;

    // Weather: use OpenWeather 16-day forecast. Try venue city/state; fallback to Greenville, NC.
    let weather: any = null;
    if (weatherKey) {
      const kickoff = upcoming.start_date ? new Date(upcoming.start_date) : null;
      const city = upcoming.venue_city || upcoming.venue || 'Greenville';
      const state = upcoming.venue_state || 'NC';
      const query = encodeURIComponent(`${city},${state},US`);
      const forecastUrl = new URL('https://api.openweathermap.org/data/2.5/forecast/daily');
      forecastUrl.searchParams.set('q', query);
      forecastUrl.searchParams.set('cnt', '16');
      forecastUrl.searchParams.set('units', 'imperial');
      forecastUrl.searchParams.set('appid', weatherKey);
      try {
        const wres = await fetch(forecastUrl.toString(), { cache: 'no-store' });
        if (wres.ok) {
          const wjson = await wres.json();
          const list = Array.isArray(wjson?.list) ? wjson.list : [];
          let match = list[0];
          if (kickoff) {
            const kickoffTs = kickoff.getTime();
            const candidates: Array<{ entry: any; ts: number }> = [];
            for (const entry of list as any[]) {
              const ts = typeof entry?.dt === 'number' ? entry.dt * 1000 : NaN;
              if (Number.isFinite(ts)) {
                candidates.push({ entry, ts });
              }
            }
            candidates.sort((a, b) => Math.abs(a.ts - kickoffTs) - Math.abs(b.ts - kickoffTs));
            match = candidates[0]?.entry ?? match;
          }
          if (match) {
            const icon = match?.weather?.[0]?.icon ?? null;
            const description = match?.weather?.[0]?.description ?? null;
            const tempDay = match?.temp?.day ?? match?.temp?.eve ?? null;
            const wind = match?.speed ?? match?.wind_speed ?? null;
            const humidity = match?.humidity ?? null;
            const matchTs = typeof match?.dt === 'number' ? match.dt * 1000 : null;
            const atTs = matchTs ?? (kickoff ? kickoff.getTime() : null);
            weather = {
              temp_f: typeof tempDay === 'number' ? tempDay : null,
              description,
              icon,
              wind_mph: typeof wind === 'number' ? wind : null,
              humidity: typeof humidity === 'number' ? humidity : null,
              at: typeof atTs === 'number' ? new Date(atTs).toISOString() : null,
            };
          }
        }
      } catch (e) {
        console.error('Weather forecast fetch failed:', e);
      }
    }

    return {
      opponent,
      kickoff: upcoming.start_date,
      venue: upcoming.venue || null,
      broadcast: upcoming.tv || null,
      status: upcoming.status || 'Scheduled',
      weather,
    };
  }

  async function getTeamGames(team: string, year?: number) {
    const y = year || new Date().getFullYear();
    const url = new URL(`${BASE_URL}/games`);
    url.searchParams.append('year', String(y));
    url.searchParams.append('seasonType', 'regular');
    url.searchParams.append('team', team);
    const res = await fetch(url.toString(), {
      headers: { Authorization: AUTH_HEADER },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`CFBD games error: ${res.status}`);
    const games = await res.json();
    return Array.isArray(games) ? games : [];
  }

  async function getTeamStats(team: string, year?: number) {
    const y = year || new Date().getFullYear();
    const url = new URL(`${BASE_URL}/stats/season`);
    url.searchParams.append('year', String(y));
    url.searchParams.append('team', team);
    // Best effort: prefer non-garbage time if supported
    url.searchParams.append('excludeGarbageTime', 'true');

    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: AUTH_HEADER },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`CFBD team stats error: ${res.status}`);
      const arr = await res.json();
      // Response shape can vary; fold into a flat map of statName -> value
      const flat: Record<string, number> = {} as any;
      const pushStat = (k: any, v: any) => {
        const key = String(k || '').toLowerCase();
        const num = Number(v);
        if (!key) return;
        if (!Number.isFinite(num)) return;
        flat[key] = num;
      };
      if (Array.isArray(arr)) {
        for (const row of arr) {
          // Common shapes observed:
          // { team, statName, statValue }
          // or nested by categories
          if (row && typeof row === 'object') {
            const name = (row.statName ?? row.stat_name ?? row.name) as any;
            const value = (row.statValue ?? row.stat_value ?? row.value) as any;
            if (name != null && value != null) pushStat(name, value);
            // Some endpoints return arrays of stats per row.stats
            const stats = Array.isArray(row.stats) ? row.stats : [];
            for (const s of stats) {
              pushStat(s?.statName ?? s?.name, s?.statValue ?? s?.value);
            }
          }
        }
      }

      // Map into our normalized fields
      const get = (keys: string[]) => {
        for (const k of keys) {
          const v = flat[k.toLowerCase()];
          if (typeof v === 'number' && Number.isFinite(v)) return v;
        }
        // try find by includes
        const foundKey = Object.keys(flat).find((kk) => keys.some((k) => kk.includes(k.toLowerCase())));
        return foundKey ? flat[foundKey] : null;
      };

      return {
        pointsPerGame: get(['pointspergame', 'ppg']),
        totalYardsPerGame: get(['totalyardspergame', 'yardspergame', 'totaloffense']),
        rushingYardsPerGame: get(['rushingyardspergame', 'rushyardspergame', 'rushing']),
        passingYardsPerGame: get(['passingyardspergame', 'passyardspergame', 'passing']),
        thirdDownConversionPct: get(['thirddownconversionpct', 'thirdDownEff', 'thirdDownPercentage']),
        turnovers: get(['turnovers']),
      };
    } catch (e) {
      return {};
    }
  }

  return {
    getGamesByDate,
    getPregame,
    getTeamGames,
    getTeamStats,
  };
}
