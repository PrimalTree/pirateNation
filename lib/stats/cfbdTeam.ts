// lib/stats/cfbdTeam.ts
const CFBD_BASE = 'https://api.collegefootballdata.com';

type Leader = { name: string; value: number };
export type TeamLeaders = {
  passing?: Leader;    // by passing yards
  rushing?: Leader;    // by rushing yards
  receiving?: Leader;  // by receiving yards
  tackles?: Leader;    // by total tackles
  interceptions?: Leader; // by interceptions
};

export type TeamPerGame = {
  pointsPerGame?: number;
  pointsAgainstPerGame?: number;
  passYdsPerGame?: number;
  rushYdsPerGame?: number;
  totalOffensePerGame?: number;
  totalDefensePerGame?: number;
  thirdDownPct?: number;     // 0-100
  redZonePct?: number;       // 0-100
  turnoverMargin?: number;   // +/- per game
  penaltiesPerGame?: number;
  penaltyYdsPerGame?: number;
};

export type TeamBlock = {
  team: string;
  leaders: TeamLeaders;
  perGame: TeamPerGame;
};

function headers(key: string) {
  return { Authorization: `Bearer ${key}` };
}
function pct(x?: number | null) {
  if (x == null) return undefined;
  return Math.round(Number(x) * 1000) / 10; // 1 decimal
}
function avg(nums: number[]) {
  if (!nums.length) return undefined;
  const s = nums.reduce((a, b) => a + b, 0);
  return Math.round((s / nums.length) * 10) / 10;
}

async function cfbd<T>(url: URL, key: string): Promise<T> {
  const res = await fetch(url.toString(), { headers: headers(key), cache: 'no-store' });
  if (!res.ok) throw new Error(`${url.pathname} ${res.status}`);
  return res.json() as Promise<T>;
}

/** Leaders by category from player season stats */
async function getLeaders(team: string, year: number, key: string): Promise<TeamLeaders> {
  const mk = (cat: string) => {
    const u = new URL(`${CFBD_BASE}/stats/player/season`);
    u.searchParams.set('year', String(year));
    u.searchParams.set('team', team);
    u.searchParams.set('category', cat); // passing|rushing|receiving|defense
    return u;
  };
  const [passArr, rushArr, recvArr, defArr] = await Promise.all([
    cfbd<any[]>(mk('passing'), key).catch(() => []),
    cfbd<any[]>(mk('rushing'), key).catch(() => []),
    cfbd<any[]>(mk('receiving'), key).catch(() => []),
    cfbd<any[]>(mk('defense'), key).catch(() => []),
  ]);

  const topBy = (arr: any[], field: string): Leader | undefined => {
    const rows = arr
      .map((p) => ({
        name: p.player ?? p.name,
        v: Number(p[field] ?? p.statistics?.[field]),
      }))
      .filter((x) => x.name && Number.isFinite(x.v));
    if (!rows.length) return undefined;
    const top = rows.sort((a, b) => b.v - a.v)[0];
    return { name: top.name, value: top.v };
  };

  return {
    passing: topBy(passArr, 'passingYards'),
    rushing: topBy(rushArr, 'rushingYards'),
    receiving: topBy(recvArr, 'receivingYards'),
    tackles: topBy(defArr, 'tackles'),
    interceptions: topBy(defArr, 'interceptions'),
  };
}

/** Per-game team stats + PPG/PAPG computed from game-by-game */
async function getTeamBlock(team: string, year: number, key: string): Promise<TeamBlock> {
  // Team season stats (rates/totals)
  const sUrl = new URL(`${CFBD_BASE}/stats/season`);
  sUrl.searchParams.set('year', String(year));
  sUrl.searchParams.set('team', team);
  const season = (await cfbd<any[]>(sUrl, key).catch(() => []))[0] || {};

  // PPG/PAPG + yards per game from game team stats
  const gUrl = new URL(`${CFBD_BASE}/games/teams`);
  gUrl.searchParams.set('year', String(year));
  gUrl.searchParams.set('team', team);
  const games = await cfbd<any[]>(gUrl, key).catch(() => []);

  const pf: number[] = [];
  const pa: number[] = [];
  const offPass: number[] = [];
  const offRush: number[] = [];
  const defYds: number[] = [];

  for (const g of games) {
    const t = (g.teams || []).find((x: any) => String(x.school).toLowerCase() === team.toLowerCase());
    const o = (g.teams || []).find((x: any) => String(x.school).toLowerCase() !== team.toLowerCase());
    if (!t || !o) continue;
    if (Number.isFinite(+t.points)) pf.push(+t.points);
    if (Number.isFinite(+o.points)) pa.push(+o.points);

    const stat = (arr: any[], k: string) => Number((arr || []).find((s: any) => String(s.category).toLowerCase() === k)?.stat);
    const tp = stat(t.stats, 'passingyards');
    const tr = stat(t.stats, 'rushingyards');
    if (Number.isFinite(tp)) offPass.push(tp);
    if (Number.isFinite(tr)) offRush.push(tr);

    const op = stat(o.stats, 'passingyards');
    const or = stat(o.stats, 'rushingyards');
    if (Number.isFinite(op) || Number.isFinite(or)) defYds.push((op || 0) + (or || 0));
  }

  const perGame: TeamPerGame = {
    pointsPerGame: avg(pf),
    pointsAgainstPerGame: avg(pa),
    passYdsPerGame: avg(offPass),
    rushYdsPerGame: avg(offRush),
    totalDefensePerGame: avg(defYds),
    totalOffensePerGame: season.totalOffense ?? undefined,
    thirdDownPct: pct(season.thirdDownConversion),
    redZonePct: pct(season.redZonePercentage),
    turnoverMargin: season.turnoverMargin ?? undefined,
    penaltiesPerGame: season.penaltiesPerGame ?? season.penalties_pg ?? undefined,
    penaltyYdsPerGame: season.penaltyYardsPerGame ?? season.penalty_yds_pg ?? undefined,
  };

  const leaders = await getLeaders(team, year, key);
  return { team, perGame, leaders };
}

export async function inferUpcomingOpponent(team: string, year: number, key: string): Promise<string | null> {
  const u = new URL(`${CFBD_BASE}/games`);
  u.searchParams.set('year', String(year));
  u.searchParams.set('team', team);
  const sched = await cfbd<any[]>(u, key).catch(() => []);
  const now = Date.now();
  const upcoming = sched
    .filter((g) => g.start_date)
    .map((g) => ({ g, ts: new Date(g.start_date).getTime() }))
    .filter(({ ts }) => Number.isFinite(ts) && ts >= now)
    .sort((a, b) => a.ts - b.ts)[0]?.g;
  if (!upcoming) return null;
  const home = String(upcoming.home_team ?? '').trim();
  const away = String(upcoming.away_team ?? '').trim();
  if (!home && !away) return null;
  if (home.toLowerCase() === team.toLowerCase()) return away || null;
  if (away.toLowerCase() === team.toLowerCase()) return home || null;
  return home || away || null;
}

/** Public: team + opponent blocks. If opponent omitted, infer from the next scheduled game. */
export async function getTeamAndOpponentBlocks(
  team: string,
  year: number,
  key: string,
  opponent?: string
): Promise<{ team: TeamBlock; opponent?: TeamBlock; inferredOpponent?: string }> {
  let opp = opponent;

  if (!opp) {
    const inferred = await inferUpcomingOpponent(team, year, key);
    if (inferred) opp = inferred;
  }

  const [teamBlock, oppBlock] = await Promise.all([
    getTeamBlock(team, year, key),
    opp ? getTeamBlock(opp, year, key) : Promise.resolve(undefined),
  ]);

  return {
    team: teamBlock,
    opponent: oppBlock,
    inferredOpponent: !opponent && opp ? opp : undefined,
  };
}
