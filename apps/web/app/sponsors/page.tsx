"use client";
import { useState } from 'react';

export default function SponsorsPage() {
  const sponsors = [
    { name: 'Sup Dogs', perk: '10% off on game day', code: 'PIRATE10', url: '#' },
    { name: 'Pirate Coffee Co.', perk: 'BOGO cold brew', code: 'PIRATEBREW', url: '#' },
    { name: 'Downtown Deli', perk: 'Free chips with sandwich', code: 'PIRATECHIPS', url: '#' },
    { name: 'Greenville Fitness', perk: '$5 day pass', code: 'PIRATEFIT', url: '#' }
  ];
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(code: string) {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1500); } catch {}
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Sponsors</h1>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="grid gap-3 md:grid-cols-2">
          {sponsors.map((s) => (
            <div key={s.name} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-3">
              <div className="font-medium text-zinc-100">{s.name}</div>
              <div className="text-xs text-zinc-400">{s.perk}</div>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => copy(s.code)} className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-xs text-yellow-200">Copy code</button>
                <a href={s.url} className="text-xs text-zinc-300 underline">Details</a>
                {copied === s.code && <span className="text-xs text-green-400">Copied!</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
