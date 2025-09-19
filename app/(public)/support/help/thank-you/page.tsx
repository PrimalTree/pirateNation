"use client";
import { useEffect, useMemo, useState } from 'react';

export default function ThankYouPage() {
  const [status, setStatus] = useState<string>('Processing your donation...');
  const [ok, setOk] = useState<boolean>(false);
  const [summary, setSummary] = useState<{ amount?: number; recipient?: string } | null>(null);

  const sessionId = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const u = new URL(window.location.href);
    return u.searchParams.get('session_id') ?? undefined;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const u = new URL(window.location.href);
        if (u.searchParams.get('mock')) {
          setOk(true);
          const amount = Number(u.searchParams.get('amount') || '0') || undefined;
          const recipient = u.searchParams.get('recipient') || undefined;
          setSummary({ amount, recipient: recipient || undefined });
          setStatus('Donation recorded (dev mode). Thank you!');
          return;
        }
        if (!sessionId) {
          setStatus('Thank you!');
          return;
        }
        const res = await fetch('/api/donate/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });
        if (res.ok) {
          setOk(true);
          const data = await res.json();
          if (data?.donation) {
            setSummary({ amount: Number(data.donation.amount) || undefined, recipient: data.donation.recipient || undefined });
          }
          setStatus('Thank you for your donation!');
        } else {
          const txt = await res.text();
          setStatus(`Donation confirmed, but failed to record: ${txt}`);
        }
      } catch (e: any) {
        setStatus('Thank you!');
      }
    })();
  }, [sessionId]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Thank You</h1>
      <p className="text-zinc-300">{status}</p>
      {summary && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
          {summary.recipient ? (
            <div>
              Recipient: <span className="font-medium text-zinc-100">{summary.recipient}</span>
            </div>
          ) : null}
          {summary.amount ? (
            <div>
              Amount: <span className="font-medium text-zinc-100">${summary.amount}</span>
            </div>
          ) : null}
        </div>
      )}

      {ok && (
        <a href="/gameday" className="inline-flex items-center gap-2 rounded-xl bg-ecu-gold px-3 py-2 font-semibold text-black hover:opacity-90">Back to Gameday</a>
      )}
    </div>
  );
}
