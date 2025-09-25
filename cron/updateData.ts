import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchEspnTeamSchedule, normalizeEspnTeamSchedule, fetchEspnTeamRoster, normalizeEspnTeamRoster, fetchEspnScoreboard, normalizeEspnScoreboard } from '../services/fetcher/espn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ECU_TEAM_ID = '151';
const CFBD_API_KEY = process.env.CFBD_API_KEY as string | undefined;
const CFBD_TEAM_NAME = (process.env.CFBD_TEAM_NAME as string) || 'East Carolina';
const CFBD_YEAR = Number(process.env.CFBD_YEAR || new Date().getFullYear());

async function fetchCfbdRoster(): Promise<any[]> {
  if (!CFBD_API_KEY) return [];
  const url = new URL('https://api.collegefootballdata.com/roster');
  url.searchParams.set('team', CFBD_TEAM_NAME);
  url.searchParams.set('year', String(CFBD_YEAR));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${CFBD_API_KEY}` } });
  if (!res.ok) throw new Error(`CFBD roster failed: ${res.status}`);
  const json = await res.json();
  const arr = Array.isArray(json) ? json : [];
  // Map to public roster schema
  return arr.map((p: any) => ({
    id: String(p.id ?? ''),
    name: [p.first_name, p.last_name].filter(Boolean).join(' ').trim(),
    position: (p.position || '').toString().toUpperCase() || undefined,
    number: typeof p.jersey === 'string' ? parseInt(p.jersey, 10) : (Number.isFinite(p.jersey) ? p.jersey : undefined),
  })).filter((x: any) => x.name);
}

async function main() {
  console.log('Updating data files...');

  try {
    const scheduleData = await fetchEspnTeamSchedule(ECU_TEAM_ID);
    const normalizedGames = normalizeEspnTeamSchedule(scheduleData);

    // Enrich with final scores when available by querying ESPN scoreboard per game date
    async function enrichWithScores(games: any[]) {
      const byDate = new Map<string, any[]>();
      for (const g of games) {
        if (!g.when) continue;
        const d = new Date(g.when);
        if (!Number.isFinite(d.getTime())) continue;
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const key = `${y}${m}${day}`;
        const list = byDate.get(key) || [];
        list.push({ game: g, ts: d.getTime() });
        byDate.set(key, list);
      }

      const out: any[] = [];
      for (const [yyyymmdd, dayGames] of byDate.entries()) {
        try {
          const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${yyyymmdd}`;
          const sbJson = await fetchEspnScoreboard(url);
          const allEvents = normalizeEspnScoreboard(sbJson);
          // Filter ECU events only
          const ecuEvents = allEvents.filter((evt: any) => {
            const teams: any[] = Array.isArray((evt as any)?.settings?.teams) ? (evt as any).settings.teams : [];
            const names = teams.map((t) => String(t?.name || '').toLowerCase());
            return names.some((n) => n.includes('east carolina') || n.split(/[^a-z]/i).includes('ecu'));
          });

          for (const { game, ts } of dayGames) {
            // Find closest ECU event by time
            const best = ecuEvents
              .map((e: any) => ({ e, t: e.when ? new Date(e.when as string).getTime() : Number.NaN }))
              .filter((x: any) => Number.isFinite(x.t))
              .map((x: any) => ({ e: x.e, diff: Math.abs(x.t - ts) }))
              .sort((a: any, b: any) => a.diff - b.diff)[0]?.e;

            if (best) {
              const teams: any[] = Array.isArray((best as any)?.settings?.teams) ? (best as any).settings.teams : [];
              const home = teams.find((t) => t?.homeAway === 'home') ?? teams[0];
              const away = teams.find((t) => t?.homeAway === 'away') ?? teams[1];
              const hs = home?.score;
              const as = away?.score;
              if (hs !== undefined && hs !== '' && as !== undefined && as !== '') {
                (game as any).result = {
                  home: home?.name,
                  away: away?.name,
                  homeScore: isNaN(Number(hs)) ? hs : Number(hs),
                  awayScore: isNaN(Number(as)) ? as : Number(as)
                };
                (game as any).final = `${away?.name ?? 'Away'} ${as} – ${home?.name ?? 'Home'} ${hs}`;
              }
            }
            out.push(game);
          }
        } catch {
          // If scoreboard fetch fails, push raw games
          for (const { game } of dayGames) out.push(game);
        }
      }
      return out;
    }

    const enrichedGames = await enrichWithScores(normalizedGames);

    const schedule = {
      season: new Date().getFullYear(),
      games: enrichedGames,
    };

    // Prefer CFBD roster when API key present; fallback to ESPN
    let normalizedRoster: any[] = [];
    if (CFBD_API_KEY) {
      try {
        normalizedRoster = await fetchCfbdRoster();
      } catch (e) {
        console.warn('[update-data] CFBD roster failed, falling back to ESPN:', (e as any)?.message || e);
      }
    }
    if (!Array.isArray(normalizedRoster) || normalizedRoster.length === 0) {
      const rosterData = await fetchEspnTeamRoster(ECU_TEAM_ID);
      normalizedRoster = normalizeEspnTeamRoster(rosterData);
    }

    const roster = {
      team: `${CFBD_TEAM_NAME} Pirates`.trim(),
      season: new Date().getFullYear(),
      players: normalizedRoster,
    };

    const dataDir = path.join(__dirname, '../../data/public');
    await fs.mkdir(dataDir, { recursive: true });
    const schedulePath = path.join(dataDir, 'schedule.json');
    const rosterPath = path.join(dataDir, 'roster.json');

    await fs.writeFile(schedulePath, JSON.stringify(schedule, null, 2));
    await fs.writeFile(rosterPath, JSON.stringify(roster, null, 2));

    console.log('Data files updated successfully.');
  } catch (error) {
    console.error('Error updating data files:', error);
    process.exit(1);
  }
}

main();
