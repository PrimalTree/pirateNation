"use client";
import { useState } from 'react';

type Option = { key: string; label: string };

export function QuickPoll({ pollKey = 'win-prediction', options }: { pollKey?: string; options: Option[] }) {
  const [selected, setSelected] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/engage/poll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollKey, optionKey: selected })
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit');
    } finally { setBusy(false); }
  }

  if (done) return <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">Thanks for voting!</div>;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        {options.map((o) => (
          <label key={o.key} className={[
            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2',
            selected === o.key ? 'border-ecu-gold bg-ecu-gold/10' : 'border-zinc-700 hover:bg-zinc-800'
          ].join(' ')}>
            <input type="radio" name="poll" value={o.key} checked={selected === o.key} onChange={() => setSelected(o.key)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {error && <div className="text-sm text-red-400">{error}</div>}
      <button type="submit" disabled={!selected || busy} className="w-full rounded-xl bg-ecu-gold px-4 py-2 font-semibold text-black hover:opacity-90 disabled:opacity-50">
        {busy ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  );
}

