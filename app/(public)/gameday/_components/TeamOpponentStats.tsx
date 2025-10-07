"use client";
import { useEffect, useState } from "react";

type Leader = { name: string; value: number };
type TeamBlock = {
  team: string;
  perGame: {
    pointsPerGame?: number;
    pointsAgainstPerGame?: number;
    passYdsPerGame?: number;
    rushYdsPerGame?: number;
    totalOffensePerGame?: number;
    totalDefensePerGame?: number;
    thirdDownPct?: number;
    redZonePct?: number;
    turnoverMargin?: number;
    penaltiesPerGame?: number;
    penaltyYdsPerGame?: number;
  };
  leaders: {
    passing?: Leader;
    rushing?: Leader;
    receiving?: Leader;
    tackles?: Leader;
    interceptions?: Leader;
  };
};

export default function TeamOpponentStats() {
  const [data, setData] = useState<{ team: TeamBlock; opponent?: TeamBlock; inferredOpponent?: string } | null>(null);
  const [view, setView] = useState<'TEAM' | 'OPPONENT'>('TEAM');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/stats/gameday', { cache: 'no-store' });
      if (res.ok) {
        const j = await res.json();
        setData({ team: j.team, opponent: j.opponent ?? undefined, inferredOpponent: j.inferredOpponent ?? undefined });
      }
    })();
  }, []);

  if (!data) return null;

  const block = view === 'TEAM' ? data.team : (data.opponent ?? data.team);
  const pg = block.perGame;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Team Stats</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setView('TEAM')}
            className={`rounded px-2 py-1 text-xs border ${view==='TEAM' ? 'border-ecu-gold bg-ecu-gold text-black' : 'border-zinc-700 text-zinc-200'}`}
          >
            {data.team.team}
          </button>
          {data.opponent && (
            <button
              onClick={() => setView('OPPONENT')}
              className={`rounded px-2 py-1 text-xs border ${view==='OPPONENT' ? 'border-ecu-gold bg-ecu-gold text-black' : 'border-zinc-700 text-zinc-200'}`}
            >
              {data.opponent.team}
            </button>
          )}
        </div>
      </div>

      {/* Per-game stats */}
      <div className="grid gap-3 md:grid-cols-2 text-sm">
        <Row label="Points For" value={pg.pointsPerGame} />
        <Row label="Points Against" value={pg.pointsAgainstPerGame} />
        <Row label="Pass Yds/G" value={pg.passYdsPerGame} />
        <Row label="Rush Yds/G" value={pg.rushYdsPerGame} />
        {pg.totalOffensePerGame != null && <Row label="Total Offense/G" value={pg.totalOffensePerGame} />}
        {pg.totalDefensePerGame != null && <Row label="Total Defense/G (allowed)" value={pg.totalDefensePerGame} />}
        {pg.thirdDownPct != null && <Row label="3rd Down %" value={pg.thirdDownPct} suffix="%" />}
        {pg.redZonePct != null && <Row label="Red Zone %" value={pg.redZonePct} suffix="%" />}
        {pg.turnoverMargin != null && <Row label="TO Margin" value={pg.turnoverMargin} />}
        {pg.penaltiesPerGame != null && <Row label="Penalties / G" value={pg.penaltiesPerGame} />}
        {pg.penaltyYdsPerGame != null && <Row label="Penalty Yds / G" value={pg.penaltyYdsPerGame} />}
      </div>

      {/* Leaders */}
      <h4 className="mt-4 mb-2 text-sm font-semibold">Leaders</h4>
      <div className="grid gap-2 text-sm">
        <LeaderRow label="Passing" p={block.leaders.passing} unit=" yds" />
        <LeaderRow label="Rushing" p={block.leaders.rushing} unit=" yds" />
        <LeaderRow label="Receiving" p={block.leaders.receiving} unit=" yds" />
        <LeaderRow label="Tackles" p={block.leaders.tackles} />
        <LeaderRow label="Interceptions" p={block.leaders.interceptions} />
      </div>

      {data.inferredOpponent && view === 'TEAM' && !data.opponent && (
        <div className="mt-2 text-xs text-zinc-400">
          Opponent inferred: {data.inferredOpponent}. (No stats available.)
        </div>
      )}
    </section>
  );
}

function Row({ label, value, suffix = '' }: { label: string; value?: number; suffix?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 py-1">
      <div className="text-zinc-400">{label}</div>
      <div className="text-zinc-100 font-medium">
        {typeof value === 'number' ? `${value}${suffix}` : '—'}
      </div>
    </div>
  );
}
function LeaderRow({ label, p, unit = '' }: { label: string; p?: Leader, unit?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-zinc-400">{label}</div>
      <div className="text-zinc-100">
        {p ? <span className="font-medium">{p.name}</span> : '—'}
        {p ? <span className="ml-2 text-zinc-300">{p.value}{unit}</span> : null}
      </div>
    </div>
  );
}
