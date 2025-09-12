"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '../../lib/supabase-browser';

type Poll = { id: string; question: string; options: any; is_active: boolean };

function getDeviceId() {
  try {
    const k = 'pn_device_id';
    let v = localStorage.getItem(k);
    if (!v) { v = crypto.randomUUID(); localStorage.setItem(k, v); }
    return v;
  } catch {
    return undefined;
  }
}

export default function PollsPage() {
  const supabase = createSupabaseBrowser();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('polls')
        .select('id,question,options,is_active')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!cancelled) setPolls(data ?? []);
    })();
    return () => { cancelled = true; };
  }, []);

  async function submitVote(poll: Poll, choiceIndex: number) {
    const deviceId = getDeviceId();
    try {
      await supabase.from('poll_votes').insert({ poll_id: poll.id, choice_index: choiceIndex, device_hash: deviceId });
      setVotes((v) => ({ ...v, [poll.id]: choiceIndex }));
      setSubmitted((s) => ({ ...s, [poll.id]: true }));
    } catch {}
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fan Polls</h1>
      {polls.length === 0 && <div className="text-zinc-400">No polls yet.</div>}
      {polls.map((p) => (
        <div key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="font-medium text-zinc-100">{p.question}</div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {(Array.isArray(p.options) ? p.options : []).map((opt: any, i: number) => {
              const active = votes[p.id] === i;
              return (
                <button
                  key={i}
                  disabled={!p.is_active}
                  onClick={() => submitVote(p, i)}
                  className={[
                    'rounded-xl border px-3 py-2 text-left hover:border-zinc-600',
                    active ? 'border-yellow-400 bg-yellow-400/10' : 'border-zinc-700 bg-zinc-800/60'
                  ].join(' ')}
                >
                  {String(opt)}
                </button>
              );
            })}
          </div>
          {submitted[p.id] && <div className="mt-2 text-sm text-green-300">Thanks! Your vote was recorded.</div>}
          {!p.is_active && <div className="mt-2 text-xs text-zinc-500">Poll closed</div>}
        </div>
      ))}
    </div>
  );
}
