"use client";
import { useEffect, useMemo, useState } from 'react';

type Player = { id: string; name: string; position?: string; number?: number };
type RosterJson = { players: Player[] };

export function FanVote() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [category, setCategory] = useState<'OMVP'|'DMVP'>('OMVP');
  const [playerId, setPlayerId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Use the public API serving roster.json
        const res = await fetch('/api/public/roster.json', { cache: 'no-store' });
        const body = (await res.json()) as RosterJson;
        if (!alive) return;
        const list = Array.isArray(body?.players) ? body.players : [];
        const unique = Array.from(new Map(list.map((p) => [p.id, p])).values());
        unique.sort((a, b) => (a.number ?? 9999) - (b.number ?? 9999) || a.name.localeCompare(b.name));
        setPlayers(unique);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const selected = useMemo(() => players.find((p) => p.id === playerId), [players, playerId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/vote/mvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, playerId: selected.id, playerName: selected.name, message: message.slice(0,250) })
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit vote');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
        Thanks for voting!
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        {(['OMVP','DMVP'] as const).map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setCategory(c)}
            className={[
              'rounded-md px-3 py-1 text-sm',
              category === c ? 'bg-ecu-gold text-black' : 'border border-zinc-700 text-zinc-200'
            ].join(' ')}
          >{c}</button>
        ))}
      </div>
      <label className="block text-sm">
        <span className="text-zinc-300">Select Player</span>
        <select
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
          required
        >
          <option value="">— Choose —</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>{p.number ? `#${p.number} ` : ''}{p.name} {p.position ? `(${p.position})` : ''}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-zinc-300">Message (optional)</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0,250))}
          maxLength={250}
          rows={3}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
          placeholder="Tell us why (max 250 chars)"
        />
      </label>

      {error && <div className="text-sm text-red-400">{error}</div>}
      <button type="submit" disabled={!playerId || busy} className="w-full rounded-xl bg-ecu-gold px-4 py-2 font-semibold text-black hover:opacity-90 disabled:opacity-50">
        {busy ? 'Submitting…' : `Vote ${category}`}
      </button>
    </form>
  );
}

