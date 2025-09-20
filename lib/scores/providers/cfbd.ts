import { RawGame } from '../types';

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

    // Weather: use venue city/state if present, otherwise default to Greenville
    let weather: any = null;
    if (weatherKey) {
      const city = upcoming.venue || 'Greenville';
      const q = encodeURIComponent(`${city},NC,US`);
      try {
        const wres = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?units=imperial&q=${q}&appid=${weatherKey}`,
          { cache: 'no-store' }
        );
        if (wres.ok) {
          const wjson = await wres.json();
          weather = {
            temp_f: wjson?.main?.temp ?? null,
            description: wjson?.weather?.[0]?.description ?? null,
            icon: wjson?.weather?.[0]?.icon ?? null,
            wind_mph: wjson?.wind?.speed ?? null,
            humidity: wjson?.main?.humidity ?? null,
          };
        }
      } catch (e) {
        console.error('Weather fetch failed:', e);
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

  return {
    getGamesByDate,
    getPregame,
  };
}

