import { NextResponse } from 'next/server';
import { cfbdProvider } from '../../../../lib/scores/providers/cfbd';
import {
  fetchEspnScoreboard,
  normalizeEspnScoreboard,
  fetchEspnTeamSchedule,
  normalizeEspnTeamSchedule,
} from '@pirate-nation/fetcher';
import 

declare const process: NodeJS.Process;

const ECU_NAME = process.env.TEAM_NAME?.toLowerCase() || 'east carolina';
const ECU_TEAM_ID = '151'; // ESPN team ID
const PROVIDER = process.env.SCORE_PROVIDER || 'espn';

let cache: { data: any; ts: number } | null = null;
const TTL_MS = 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < TTL_MS) {
      return NextResponse.json(cache.data);
    }

    let body: any = null;

    if (PROVIDER === 'cfbd') {
      const provider = cfbdProvider(
        process.env.CFBD_API_KEY!,
        process.env.OPENWEATHER_API_KEY
      );
      body = await provider.getPregame(process.env.TEAM_NAME || 'East Carolina');
    } else {
      // ---- ESPN logic (unchanged from your version) ----
      const sbRaw = await fetchEspnScoreboard();
      let schedRaw: unknown | null = null;
      try {
        schedRaw = await fetchEspnTeamSchedule(ECU_TEAM_ID);
      } catch {}

      const events = normalizeEspnScoreboard(sbRaw).filter((g) => {
        try {
          const name = (g?.name ?? '').toString().toLowerCase();
          const teams: any[] | undefined = (g?.settings as any)?.teams;
          const teamHit =
            Array.isArray(teams) &&
            teams.some(
              (t) =>
                String(t?.name ?? '').toLowerCase().includes(ECU_NAME) ||
                String(t?.name ?? '').toUpperCase() === 'ECU'
            );
          const nameHit =
            name.includes(ECU_NAME) || name.split(/[^a-z]/i).includes('ecu');
          return teamHit || nameHit;
        } catch {
          return false;
        }
      });

      const current =
        events.find((g) =>
          String((g?.settings as any)?.status ?? '')
            .toLowerCase()
            .includes('live')
        ) ||
        events.find((g) =>
          g.when ? new Date(g.when as string).getTime() >= now : false
        ) ||
        events[events.length - 1];

      const sched = schedRaw ? normalizeEspnTeamSchedule(schedRaw) : [];
      let broadcast: string | undefined;
      let venue: string | undefined;
      if (current?.when) {
        const target = new Date(current.when as string).getTime();
        let nearest = { diff: Infinity, item: null as any };
        for (const s of sched) {
          const t = new Date(s.when).getTime();
          const diff = Math.abs(t - target);
          if (diff < nearest.diff) nearest = { diff, item: s };
        }
        if (nearest.item) {
          broadcast = nearest.item.broadcast;
          venue = nearest.item.venue;
        }
      }

      let opponent: string | undefined;
      try {
        const teams: any[] = Array.isArray((current as any)?.settings?.teams)
          ? ((current as any).settings.teams as any[])
          : [];
        const findEcu = (n?: string) => {
          const t = (n ?? '').toLowerCase();
          return t.includes(ECU_NAME) || t.split(/[^a-z]/i).includes('ecu');
        };
        const other = teams.find((t) => !findEcu(String(t?.name ?? '')));
        opponent = other?.name ?? undefined;
      } catch {}

      body = {
        opponent,
        kickoff: current?.when ?? null,
        venue: venue ?? null,
        broadcast: broadcast ?? null,
        status: (current as any)?.settings?.status ?? null,
        teams: (current as any)?.settings?.teams ?? null,
        gameName: current?.name ?? null,
        weather: null, // ESPN weather logic can be added if needed
      };
    }

    cache = { data: body, ts: now };
    return NextResponse.json(body);
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
