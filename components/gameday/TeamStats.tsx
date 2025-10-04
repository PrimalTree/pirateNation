"use client";
import { useEffect, useMemo, useState } from 'react';
import { shortTeam } from './teamName';

type TeamStatsShape = {
  pointsPerGame?: number | null;
  totalYardsPerGame?: number | null;
  rushingYardsPerGame?: number | null;
  passingYardsPerGame?: number | null;
  thirdDownConversionPct?: number | null;
  turnovers?: number | null;
};

export function TeamStats() {
  const [ours, setOurs] = useState<TeamStatsShape | null>(null);
  const [opp, setOpp] = useState<TeamStatsShape | null>(null);
  const [oppLabel, setOppLabel] = useState<string>('Opponent');
  const [oppHasInfo, setOppHasInfo] = useState<boolean>(false);
  const [oppKey, setOppKey] = useState<string>('');
  const [tab, setTab] = useState<'ours' | 'opp'>('ours');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 1) Always fetch our stats
        const oursRes = await fetch('/api/stats/team', { cache: 'no-store' });
        const oursBody = await oursRes.json();
        if (alive) setOurs(oursBody);

        // 2) Try to find opponent from pregame
        const preRes = await fetch('/api/stats/pregame', { cache: 'no-store' });
        const pre = await preRes.json();
        const teams: Array<any> = Array.isArray(pre?.teams) ? pre.teams : [];

        // Determine opponent: the team that is NOT ECU (by name includes 'east carolina' or equals 'ECU')
        const findEcu = (n?: string) => {
          const t = String(n || '').toLowerCase();
          return t.includes('east carolina') || t.split(/[^a-z]/i).includes('ecu');
        };
        // Prefer explicit opponent field when present
        const fromField = (pre?.opponent && String(pre.opponent).trim()) || '';
        if (alive && fromField) {
          setOppLabel(shortTeam(fromField));
          setOppKey(fromField);
        }

        const ecuTeam = teams.find((t) => findEcu(t?.name));
        const otherTeam = teams.find((t) => !findEcu(t?.name));
        const oppCandidateName = otherTeam?.name ? String(otherTeam.name) : '';
        if (alive && !fromField && oppCandidateName) {
          setOppLabel(shortTeam(oppCandidateName));
          setOppKey(oppCandidateName);
        }
        if (alive) setOppHasInfo(Boolean(fromField || oppCandidateName));

        const oppIdRaw = otherTeam?.id ? String(otherTeam.id) : '';
        const isNumericId = /^\d+$/.test(oppIdRaw);
        const nameForLookup = fromField || otherTeam?.name || '';
        if (alive && !oppKey) setOppKey(isNumericId ? oppIdRaw : nameForLookup);

        // If no teams in pregame, try scoreboard to get teams/ids
        if (!teams.length) {
          try {
            const sb = await fetch('/api/scoreboard', { cache: 'no-store' });
            const list = await sb.json();
            const first = Array.isArray(list) ? list[0] : null;
            const tms: Array<any> = first?.settings?.teams || [];
            const other = tms.find((t: any) => !findEcu(t?.name));
            const nmRaw = other?.name ? String(other.name) : '';
            const nm = nmRaw ? shortTeam(nmRaw) : '';
            if (alive && nm && oppLabel === 'Opponent') setOppLabel(nm);
            if (alive && nmRaw && !oppKey) setOppKey(nmRaw);
            if (alive && !oppHasInfo && nm) setOppHasInfo(true);
          } catch {}
        }
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load team stats');
      }
    })();
    return () => { alive = false; };
  }, []);

  // Fetch opponent stats when opponent key is known/changes
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const key = (oppKey || '').trim();
        if (!key) return;
        const res = await fetch(`/api/stats/team/${encodeURIComponent(key)}`, { cache: 'no-store' });
        const body = await res.json();
        if (alive) setOpp(body);
      } catch {}
    })();
    return () => { alive = false; };
  }, [oppKey]);

  const fmt = (n?: number | null) => (typeof n === 'number' && isFinite(n) ? n.toFixed(1) : '—');
  const empty = (s: TeamStatsShape | null) => !s || Object.values(s).every((v) => v == null);
  const data: TeamStatsShape | null = tab === 'opp' ? opp : ours;
  const hasOpp = oppHasInfo || !!opp;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Team Stats</h3>
        <div className="shrink-0 inline-flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
          <button
            type="button"
            onClick={() => setTab('ours')}
            className={`px-2 py-1 text-xs rounded-md ${tab === 'ours' ? 'bg-ecu-gold text-black' : 'text-zinc-300 hover:text-white'}`}
          >ECU</button>
          <button
            type="button"
            onClick={() => setTab('opp')}
            className={`px-2 py-1 text-xs rounded-md ${tab === 'opp' ? 'bg-ecu-gold text-black' : 'text-zinc-300 hover:text-white'}`}
            title={oppLabel}
          >{oppLabel}</button>
        </div>
      </div>
      {error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : empty(data) ? (
        <div className="text-sm text-zinc-400">Stats unavailable.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <div>
            <div className="text-zinc-400">PPG</div>
            <div className="text-zinc-200">{fmt(data?.pointsPerGame)}</div>
          </div>
          <div>
            <div className="text-zinc-400">Yards/G</div>
            <div className="text-zinc-200">{fmt(data?.totalYardsPerGame)}</div>
          </div>
          <div>
            <div className="text-zinc-400">Rush Yds/G</div>
            <div className="text-zinc-200">{fmt(data?.rushingYardsPerGame)}</div>
          </div>
          <div>
            <div className="text-zinc-400">Pass Yds/G</div>
            <div className="text-zinc-200">{fmt(data?.passingYardsPerGame)}</div>
          </div>
          <div>
            <div className="text-zinc-400">3rd Down %</div>
            <div className="text-zinc-200">{fmt(data?.thirdDownConversionPct)}</div>
          </div>
          <div>
            <div className="text-zinc-400">Turnovers</div>
            <div className="text-zinc-200">{fmt(data?.turnovers)}</div>
          </div>
        </div>
      )}
    </section>
  );
}
