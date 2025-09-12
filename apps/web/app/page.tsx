"use client";
import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import ClientOnly from './components/ClientOnly';

function Glow() {
  return (
    <>
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl" />
    </>
  );
}

// PirateShip and FlagCard now imported from components/FlagVisuals

function formatTimeLeft(ms: number) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function Page() {
  const defaultKickoff = new Date(Date.now() + 1000 * 60 * 60 * 24); // +24h
  const [nextGameTime, setNextGameTime] = useState<Date>(defaultKickoff);
  const [countdown, setCountdown] = useState(0);
  const [mounted, setMounted] = useState(false);
  // Fullscreen flag now handled globally via BottomNav
  useEffect(() => {
    const id = setInterval(() => setCountdown(Math.max(0, nextGameTime.getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [nextGameTime]);
  useEffect(() => setMounted(true), []);
  const timeLeft = useMemo(() => formatTimeLeft(countdown), [countdown]);
  type Game = { name: string; when?: string; settings?: any };
  const [liveGames, setLiveGames] = useState<Game[]>([]);
  const [schedule, setSchedule] = useState<Game[]>([]);
  const [lastScoreUpdate, setLastScoreUpdate] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [scoreRes, schedRes] = await Promise.all([
          fetch('/api/scoreboard', { cache: 'no-store' }),
          fetch('/api/schedule', { cache: 'force-cache' })
        ]);
        const scores = await scoreRes.json();
        const sched = await schedRes.json();
        if (mounted) {
          setLiveGames(Array.isArray(scores) ? scores : []);
          setSchedule(Array.isArray(sched) ? sched : []);
          setLastScoreUpdate(Date.now());
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Poll for live score updates
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/scoreboard', { cache: 'no-store' });
        const scores = await res.json();
        setLiveGames(Array.isArray(scores) ? scores : []);
        setLastScoreUpdate(Date.now());
      } catch {}
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Keep kickoff countdown in sync with the upcoming scheduled game
  useEffect(() => {
    try {
      const now = Date.now();
      const next = [...schedule]
        .filter((g) => typeof g.when === 'string' && g.when)
        .map((g) => ({ g, ts: new Date(g.when as string).getTime() }))
        .filter(({ ts }) => Number.isFinite(ts) && ts > now)
        .sort((a, b) => a.ts - b.ts)[0]?.g;
      if (next?.when) setNextGameTime(new Date(next.when));
    } catch {}
  }, [schedule]);
  function addKickoffToCalendar() {
    const start = nextGameTime;
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Pirate Nation//Kickoff//EN',
      'BEGIN:VEVENT',
      `UID:kickoff-${start.getTime()}@piratenation`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      'SUMMARY:Game Kickoff',
      'DESCRIPTION:Kickoff reminder from Pirate Nation',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kickoff.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8" suppressHydrationWarning>
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
        <Glow />
        <div className="relative z-10 grid items-center gap-6 md:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              <ClientOnly>Raise the Flag</ClientOnly>
            </h1>
            <p className="mt-2 max-w-prose text-zinc-300">Never miss the tradition. Tap the button and wave your phone — your digital flag will do the rest.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <p className="text-sm text-zinc-400">Use the Flag button in the bottom nav to go fullscreen during No Quarter.</p>
              <Link href="/map" className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-2 text-zinc-200 hover:bg-zinc-900">
                <Clock className="h-5 w-5" /> Game-Day Map
              </Link>
            </div>
          </div>
          {/* Preview removed */}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Kickoff Countdown</h3>
          </div>
          <p className="mt-3 text-3xl font-mono tabular-nums text-yellow-200">{mounted ? timeLeft : '—:—:—'}</p>
          <p className="mt-1 text-xs text-zinc-400">Next game: {mounted ? nextGameTime.toLocaleString() : '—'}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span>Change date:</span>
            <input type="datetime-local" className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-100" onChange={(e) => setNextGameTime(new Date(e.target.value))} />
            <button onClick={addKickoffToCalendar} className="ml-auto rounded-md border border-purple-400/30 bg-purple-500/10 px-2 py-1 text-purple-200 hover:bg-purple-500/20">Add to Calendar</button>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-2 text-sm text-zinc-400">Quick Actions</div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/polls" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 hover:bg-zinc-800">Polls</Link>
            <Link href="/sponsors" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 hover:bg-zinc-800">Sponsors</Link>
            <Link href="/feedback" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 hover:bg-zinc-800">Feedback</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          {(() => {
            const events = Array.isArray(liveGames) ? liveGames : [];
            const isLive = (g: Game) => {
              const s = g.settings?.status?.toString().toLowerCase();
              return s === 'in' || s === 'live' || s === 'inprogress' || s === 'in-progress';
            };
            const live = events.find(isLive) || null;
            const sorted = [...events]
              .filter((g) => g.when)
              .sort((a, b) => new Date(b.when!).getTime() - new Date(a.when!).getTime());
            const latest = sorted[0] || null;

            const formatScore = (g: Game | null) => {
              if (!g) return null;
              const teams = g.settings?.teams;
              if (!Array.isArray(teams)) return null;
              const home = teams.find((t: any) => t.homeAway === 'home') ?? teams[0];
              const away = teams.find((t: any) => t.homeAway === 'away') ?? teams[1];
              if (home && away) return `${away?.name ?? 'Away'} ${away?.score ?? ''} – ${home?.name ?? 'Home'} ${home?.score ?? ''}`;
              return teams.map((t: any) => `${t?.name ?? ''} ${t?.score ?? ''}`).join(' – ');
            };

            const updated = lastScoreUpdate ? new Date(lastScoreUpdate).toLocaleTimeString() : null;

            if (!live && !latest) return <p className="text-sm text-zinc-400">No games available.</p>;

            return (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between text-zinc-400">
                  <div className="text-xs uppercase tracking-wider">Scores</div>
                  {updated && <div className="text-[10px]">Updated {updated}</div>}
                </div>
                {live && (
                  <div>
                    <div className="text-xs text-emerald-400">Live</div>
                    <div className="text-zinc-200">{live.name}</div>
                    {formatScore(live) && <div className="text-lg font-semibold text-yellow-200">{formatScore(live)}</div>}
                    <div className="text-xs text-zinc-400">{live.when ? new Date(live.when).toLocaleString() : ''}</div>
                  </div>
                )}
                {latest && (!live || latest !== live) && (
                  <div>
                    <div className="text-xs text-zinc-400">Latest</div>
                    <div className="text-zinc-200">{latest.name}</div>
                    {formatScore(latest) && <div className="text-lg font-semibold text-zinc-200">{formatScore(latest)}</div>}
                    <div className="text-xs text-zinc-400">{latest.when ? new Date(latest.when).toLocaleString() : ''}</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Season Schedule</h3>
        </div>
        {schedule.length === 0 ? (
          <p className="text-sm text-zinc-400">Schedule coming soon.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {schedule.slice(0, 10).map((g, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-zinc-200">{g.name}</span>
                <span className="text-zinc-400">{g.when ? new Date(g.when).toLocaleDateString() : 'TBD'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
