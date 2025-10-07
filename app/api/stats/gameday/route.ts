// app/api/stats/gameday/route.ts
import { NextResponse } from 'next/server';
import { getTeamAndOpponentBlocks } from 'lib/stats/cfbdTeam';
import fs from 'node:fs/promises';
import path from 'node:path';

export const revalidate = 60;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const team = url.searchParams.get('team') || process.env.TEAM_NAME || 'East Carolina';
    const opponent = url.searchParams.get('opponent') || undefined;
    const year = Number(url.searchParams.get('year')) || new Date().getFullYear();
    const key = process.env.CFBD_API_KEY as string | undefined;

    if (!key) {
      const fallback = await buildFallbackGameday({ team, opponent, year });
      return NextResponse.json({
        source: 'fallback',
        year,
        team: fallback.teamBlock,
        opponent: null,
        inferredOpponent: fallback.inferredOpponent ?? null,
        ts: Date.now(),
      });
    }

    try {
      const data = await getTeamAndOpponentBlocks(team, year, key, opponent);
      return NextResponse.json({
        source: 'cfbd',
        year,
        team: data.team,
        opponent: data.opponent || null,
        inferredOpponent: data.inferredOpponent || null,
        ts: Date.now(),
      });
    } catch (error) {
      const fallback = await buildFallbackGameday({ team, opponent, year });
      return NextResponse.json({
        source: 'fallback',
        year,
        team: fallback.teamBlock,
        opponent: null,
        inferredOpponent: fallback.inferredOpponent ?? null,
        ts: Date.now(),
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}


async function buildFallbackGameday({ team, opponent, year }: { team: string; opponent?: string; year: number }) {
  const games = await loadScheduleGames();
  const relevant = games.filter((game) => isTeamGame(game, team, year));
  const pointsFor: number[] = [];
  const pointsAgainst: number[] = [];

  for (const game of relevant) {
    const result = normalizeResult(game, team);
    if (!result) continue;
    const { teamScore, oppScore } = result;
    if (teamScore != null && oppScore != null) {
      pointsFor.push(teamScore);
      pointsAgainst.push(oppScore);
    }
  }

  const perGame: Record<string, number | undefined> = {};
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined);
  const pf = avg(pointsFor);
  const pa = avg(pointsAgainst);
  if (pf != null) perGame.pointsPerGame = Math.round(pf * 10) / 10;
  if (pa != null) perGame.pointsAgainstPerGame = Math.round(pa * 10) / 10;

  const upcomingOpponent = opponent ?? inferOpponentFromSchedule(games, team);
  return {
    teamBlock: { team, perGame, leaders: {} },
    inferredOpponent: opponent ? undefined : upcomingOpponent || undefined,
  };
}

async function loadScheduleGames() {
  try {
    const schedulePath = path.join(process.cwd(), 'data', 'public', 'schedule.json');
    const raw = await fs.readFile(schedulePath, 'utf-8');
    const json = JSON.parse(raw) as { games?: any[] };
    const games = Array.isArray(json?.games) ? json.games : [];
    return games;
  } catch {
    return [];
  }
}

function isTeamGame(game: any, team: string, year: number) {
  const when = game?.when ?? game?.start;
  if (when) {
    const ts = Date.parse(String(when));
    if (Number.isFinite(ts)) {
      const d = new Date(ts);
      if (d.getUTCFullYear() !== year) return false;
    }
  }
  return stringMatchesTeam(String(game?.name ?? ''), team) || includesTeamEntry(game?.settings?.teams, team) || includesTeamEntry([game?.home, game?.away], team);
}

function includesTeamEntry(source: any, team: string) {
  const list = Array.isArray(source) ? source : [source];
  return list.some((entry) => stringMatchesTeam(String(entry?.name ?? entry ?? ''), team));
}

function stringMatchesTeam(value: string, team: string) {
  const lower = value.toLowerCase();
  if (!lower) return false;
  for (const alias of teamAliases(team)) {
    if (!alias) continue;
    if (lower.includes(alias)) return true;
    const tokens = lower.split(/[^a-z]/i).filter(Boolean);
    const aliasTokens = alias.split(/[^a-z]/i).filter(Boolean);
    if (aliasTokens.length && aliasTokens.every((token) => tokens.includes(token))) return true;
  }
  return false;
}

function teamAliases(team: string) {
  const base = team.toLowerCase();
  const aliases = [base, base.replace(/\s+/g, '')];
  const initials = base.split(/\s+/).filter(Boolean).map((word) => word[0]).join('');
  if (initials) aliases.push(initials.toLowerCase());
  if (base.includes('east carolina')) {
    aliases.push('ecu', 'pirates');
  }
  return Array.from(new Set(aliases.filter(Boolean)));
}

function normalizeResult(game: any, team: string) {
  const res = game?.result;
  if (!res) return null;
  const homeName = String(res.home ?? game?.home ?? '');
  const awayName = String(res.away ?? game?.away ?? '');
  const homeScore = Number(res.homeScore);
  const awayScore = Number(res.awayScore);
  const teamIsHome = stringMatchesTeam(homeName, team);
  const teamIsAway = stringMatchesTeam(awayName, team);
  if (!teamIsHome && !teamIsAway) return null;
  const teamScore = teamIsHome ? (Number.isFinite(homeScore) ? homeScore : null) : (Number.isFinite(awayScore) ? awayScore : null);
  const oppScore = teamIsHome ? (Number.isFinite(awayScore) ? awayScore : null) : (Number.isFinite(homeScore) ? homeScore : null);
  return { teamScore, oppScore, isHomeTeam: teamIsHome, game } as const;
}

function inferOpponentFromSchedule(games: any[], team: string) {
  const now = Date.now();
  const upcoming = games
    .map((g) => ({ g, ts: Date.parse(g?.when ?? g?.start ?? '') }))
    .filter(({ ts }) => Number.isFinite(ts) && ts >= now)
    .sort((a, b) => a.ts - b.ts)[0]?.g;
  if (!upcoming) return null;
  const result = normalizeResult(upcoming, team);
  if (result) {
    const { game, isHomeTeam } = result;
    const res = game?.result || {};
    const homeName = String(res.home ?? game?.home ?? '').trim();
    const awayName = String(res.away ?? game?.away ?? '').trim();
    return isHomeTeam ? awayName || null : homeName || null;
  }
  const name = String(upcoming?.name ?? '');
  return deriveOpponentFromName(name, team);
}

function deriveOpponentFromName(name: string, team: string): string | null {
  if (!name) return null;
  const parts = name.split(/\s+(at|vs\.?|vs)\s+/i);
  if (parts.length < 3) return null;
  const host = parts[0];
  const guest = parts.slice(2).join(' ');
  if (stringMatchesTeam(guest, team)) return host.trim() || null;
  if (stringMatchesTeam(host, team)) return guest.trim() || null;
  return guest.trim() || host.trim() || null;
}
