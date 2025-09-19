"use client";
import { useEffect, useState } from 'react';

type TeamStats = {
  pointsPerGame?: number | null;
  totalYardsPerGame?: number | null;
  rushingYardsPerGame?: number | null;
  passingYardsPerGame?: number | null;
  thirdDownConversionPct?: number | null;
  turnovers?: number | null;
};

export function TeamStats() {
  const [data, setData] = useState<TeamStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/stats/team', { cache: 'no-store' });
        const body = await res.json();
        if (alive) setData(body);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load team stats');
      }
    })();
    return () => { alive = false; };
  }, []);

  const fmt = (n?: number | null) => (typeof n === 'number' && isFinite(n) ? n.toFixed(1) : '—');

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <h3 className="mb-2 text-sm font-semibold">Team Stats</h3>
      {error ? (
        <div className="text-sm text-red-400">{error}</div>
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

