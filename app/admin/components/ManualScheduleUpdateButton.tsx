"use client";
import { useState, useTransition } from 'react';
import { updateSchedule } from '../actions';

export function ManualScheduleUpdateButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  const run = () => {
    setMsg(null);
    start(async () => {
      const res = await updateSchedule();
      setOk(!!res.ok);
      setMsg(res.ok ? `Schedule updated (${res.count ?? '?' } games)` : (res.error || 'Update failed'));
      setTimeout(() => setMsg(null), 3000);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-md bg-ecu-purple px-3 py-1.5 text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Updating…' : 'Update Schedule'}
      </button>
      {msg && (
        <span className={ok ? 'text-emerald-300' : 'text-red-300'}>{msg}</span>
      )}
    </div>
  );
}
