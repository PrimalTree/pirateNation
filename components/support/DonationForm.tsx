"use client";
import { useMemo, useState } from 'react';

type Recipient = 'OMVP' | 'DMVP' | 'TEAM';

const AMOUNTS = [5, 10, 25, 50, 100] as const;

export function DonationForm() {
  const [recipient, setRecipient] = useState<Recipient>('TEAM');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState<number>(25);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => busy || !AMOUNTS.includes(amount as any), [busy, amount]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/donate/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, message: message.slice(0, 250), amount }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const url = data?.url as string | undefined;
      if (!url) throw new Error('No checkout URL');
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message || 'Failed to start checkout');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div className="mb-2 font-semibold">Choose recipient</div>
        <div className="flex gap-2">
          {(['OMVP','DMVP','TEAM'] as Recipient[]).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRecipient(r)}
              className={[
                'rounded-lg border px-3 py-1 text-sm',
                recipient === r ? 'border-ecu-gold bg-ecu-gold text-black' : 'border-zinc-700 text-zinc-200 hover:bg-zinc-800'
              ].join(' ')}
            >{r}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 250))}
          maxLength={250}
          rows={4}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
          placeholder="Say something to the team (max 250 chars)"
        />
        <div className="mt-1 text-right text-xs text-zinc-500">{message.length}/250</div>
      </div>

      <div>
        <div className="mb-2 font-semibold">Select amount</div>
        <div className="flex flex-wrap gap-2">
          {AMOUNTS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setAmount(a)}
              className={[
                'rounded-lg border px-3 py-1 text-sm',
                amount === a ? 'border-ecu-gold bg-ecu-gold text-black' : 'border-zinc-700 text-zinc-200 hover:bg-zinc-800'
              ].join(' ')}
            >${a}</button>
          ))}
        </div>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-xl bg-ecu-gold px-4 py-2 font-semibold text-black hover:opacity-90 disabled:opacity-50"
      >{busy ? 'Processing...' : `Donate $${amount}`}</button>
    </form>
  );
}

