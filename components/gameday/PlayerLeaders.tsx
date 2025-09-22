"use client";
// NOTE: This component is temporarily disabled because the ESPN API for player leaders is no longer reliable.
// To re-enable, switch the data provider to 'cfbd' and provide a valid CFBD_API_KEY.
// The component is currently not rendered in `app/(public)/gameday/page.tsx`.

import { useEffect, useState } from 'react';

type Leaders = Record<string, { name: string; value: number | string }>;

const LABELS: Record<string, string> = {
  passingyards: 'Passing Yds',
  rushingyards: 'Rushing Yds',
  receivingyards: 'Receiving Yds',
  tackles: 'Tackles',
  sacks: 'Sacks',
};

export function PlayerLeaders() {
  const [data, setData] = useState<Leaders | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/stats/players', { cache: 'no-store' });
        const body = await res.json();
        if (alive) setData(body);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load player leaders');
      }
    })();
    return () => { alive = false; };
  }, []);

  const rows = (() => {
    const out: Array<{ label: string; name: string; value: number | string } | null> = [];
    if (data) {
      for (const key of Object.keys(LABELS)) {
        const entry = data[key];
        if (entry) out.push({ label: LABELS[key], name: entry.name, value: entry.value });
      }
    }
    return out.filter(Boolean) as Array<{ label: string; name: string; value: number | string }>;
  })();

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <h3 className="mb-2 text-sm font-semibold">Player Leaders</h3>
      {error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-zinc-400">Leaders unavailable.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm">
              <div>
                <div className="text-zinc-400">{r.label}</div>
                <div className="text-zinc-200">{r.name}</div>
              </div>
              <div className="text-lg font-semibold text-ecu-gold">{r.value}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

