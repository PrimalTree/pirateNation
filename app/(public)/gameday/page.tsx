"use client";
import { useEffect, useMemo, useState, useRef } from 'react';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import ClientOnly from '../../components/ClientOnly';
import { FlagCard } from '../../../components/gameday/FlagVisuals';
import scheduleData from '../../../data/public/schedule.json';
import { StadiumMap } from '../../../components/StadiumMap';

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
  if (ms <= 0) return '00-00-00-00';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const rem = totalSeconds % 86400;
  const h = String(Math.floor(rem / 3600)).padStart(2, '0');
  const m = String(Math.floor((rem % 3600) / 60)).padStart(2, '0');
  const s = String(rem % 60).padStart(2, '0');
  const d = String(days).padStart(2, '0');
  return `${d}:${h}:${m}:${s}`;
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
  const parts = useMemo(() => {
    const totalSeconds = Math.max(0, Math.floor(countdown / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const rem = totalSeconds % 86400;
    const hours = Math.floor(rem / 3600);
    const minutes = Math.floor((rem % 3600) / 60);
    const seconds = rem % 60;
    return { d: days, h: hours, m: minutes, s: seconds };
  }, [countdown]);
  type Game = { name: string; when?: string; settings?: any };
  type StaticResult = { home?: string; away?: string; homeScore?: number | string; awayScore?: number | string };
  type StaticGame = { id: string; name: string; when?: string; venue?: string; broadcast?: string; final?: string; result?: StaticResult };
  const [liveGames, setLiveGames] = useState<Game[]>([]);
  const [schedule, setSchedule] = useState<StaticGame[]>(Array.isArray((scheduleData as any)?.games) ? (scheduleData as any).games : []);
  const [lastScoreUpdate, setLastScoreUpdate] = useState<number | null>(null);
  const mountedRef = useRef(true);
  
  // Fetch initial data and set up polling
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch (live scores only; schedule is static)
    (async () => {
      try {
        const scoreRes = await fetch('/api/scoreboard', { cache: 'no-store' });
        const scores = await scoreRes.json();
        if (mountedRef.current) {
          setLiveGames(Array.isArray(scores) ? scores : []);
          setLastScoreUpdate(Date.now());
        }
      } catch {}
    })();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/scoreboard', { cache: 'no-store' });
        const scores = await res.json();
        if (mountedRef.current) {
          setLiveGames(Array.isArray(scores) ? scores : []);
          setLastScoreUpdate(Date.now());
        }
      } catch {}
    }, 30000);
    
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  // Keep kickoff countdown in sync with the upcoming scheduled game
  useEffect(() => {
    try {
      const now = Date.now();
      const next = [...schedule]
        .filter((g) => typeof g.when === 'string' && g.when)
        .map((g) => ({ g, ts: new Date(g.when as string).getTime() }))
        .filter(({ ts }) => Number.isFinite(ts) && ts > now)
        .sort((a, b) => a.ts - b.ts)[0]?.g as StaticGame | undefined;
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
      {(() => {
        const events = Array.isArray(liveGames) ? liveGames : [];
        const isLive = (g: Game) => String(g?.settings?.status ?? '').toLowerCase().match(/live|inprogress|in-progress|in/) != null;
        const live = events.find(isLive) || null as any;
        const formatScore = (g: any) => {
          try {
            const teams: any[] = Array.isArray(g?.settings?.teams) ? g.settings.teams : [];
            const home = teams.find((t: any) => t?.homeAway === 'home') ?? teams[0];
            const away = teams.find((t: any) => t?.homeAway === 'away') ?? teams[1];
            if (home && away) return `${away?.name ?? 'Away'} ${away?.score ?? ''} – ${home?.name ?? 'Home'} ${home?.score ?? ''}`;
            return teams.map((t: any) => `${t?.name ?? ''} ${t?.score ?? ''}`).join(' – ');
          } catch { return null; }
        };
        if (live) {
          const score = formatScore(live);
          return (
            <section className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-emerald-300">Live</div>
              </div>
              <div className="mt-1 text-zinc-200">{live.name}</div>
              {score && <div className="text-xl font-semibold text-ecu-gold">{score}</div>}
              <div className="text-xs text-zinc-400">{live.when ? new Date(live.when as string).toLocaleString() : ''}</div>
            </section>
          );
        }
        return (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Kickoff Countdown</h3>
              <button onClick={addKickoffToCalendar} className="rounded-md border border-purple-400/30 bg-purple-500/10 px-2 py-1 text-xs text-purple-200 hover:bg-purple-500/20">Add to Calendar</button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-2xl font-mono tabular-nums text-ecu-gold">{mounted ? String(parts.d).padStart(2, '0') : '00'}</div>
                <div className="text-[10px] tracking-wide text-zinc-400">Days</div>
              </div>
              <div>
                <div className="text-2xl font-mono tabular-nums text-ecu-gold">{mounted ? String(parts.h).padStart(2, '0') : '00'}</div>
                <div className="text-[10px] tracking-wide text-zinc-400">Hours</div>
              </div>
              <div>
                <div className="text-2xl font-mono tabular-nums text-ecu-gold">{mounted ? String(parts.m).padStart(2, '0') : '00'}</div>
                <div className="text-[10px] tracking-wide text-zinc-400">Minutes</div>
              </div>
              <div>
                <div className="text-2xl font-mono tabular-nums text-ecu-gold">{mounted ? String(parts.s).padStart(2, '0') : '00'}</div>
                <div className="text-[10px] tracking-wide text-zinc-400">Seconds</div>
              </div>
            </div>
            <p className="mt-1 text-xs text-zinc-400">Next game: {mounted ? nextGameTime.toLocaleString() : '-'}</p>
          </section>
        );
      })()}
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
            </div>
          </div>
          <div>
            <Link href="/flag" aria-label="Raise the Flag">
              <FlagCard className="max-w-[280px] md:max-w-[320px]" />
            </Link>
          </div>
        </div>
      </section>

        <div className="hidden">
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
        <div className="hidden">
          <div className="mb-2 text-sm text-zinc-400">Quick Actions</div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/engage/polls" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 hover:bg-zinc-800">Polls</Link>
            <Link href="/support/sponsors" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 hover:bg-zinc-800">Sponsors</Link>
          </div>
        </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Season Schedule</h3>
        </div>
        {schedule.length === 0 ? (
          <p className="text-sm text-zinc-400">Schedule coming soon.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {schedule
              .filter((g) => {
                try {
                  if (!g.when) return false;
                  const d = new Date(g.when as string);
                  if (!(Number.isFinite(d.getTime()) && d.getUTCFullYear() === 2025)) return false;
                  const name = (g?.name ?? '').toString().toLowerCase();
                  const mentionsECU = (s: unknown) => {
                    const t = String(s ?? '').toLowerCase();
                    return t.includes('east carolina') || t.split(/[^a-z]/i).includes('ecu');
                  };
                  const teams: any[] = Array.isArray((g as any).settings?.teams) ? (g as any).settings!.teams as any[] : [];
                  const teamHit = teams.some((t: any) => mentionsECU(t?.name));
                  const nameHit = mentionsECU(name);
                  return teamHit || nameHit;
                } catch { return false; }
              })
              .sort((a, b) => new Date(a.when as string).getTime() - new Date(b.when as string).getTime())
              .map((g, i) => {
                const d: any = g.when ? new Date(g.when as string) : null;
                const isPast = d && Number.isFinite(d.getTime()) && d.getTime() < Date.now();
                // Try to match static game with a liveGames entry (for scores)
                const lg = (() => {
                  try {
                    const byTime = liveGames
                      .filter((x) => !!x.when)
                      .map((x) => ({ x, dt: new Date(x.when as string).getTime() }))
                      .filter(({ dt }) => Number.isFinite(dt));
                    const target = d ? d.getTime() : 0;
                    const near = byTime
                      .map(({ x, dt }) => ({ x, diff: Math.abs(dt - target) }))
                      .sort((a, b) => a.diff - b.diff)[0]?.x;
                    return near;
                  } catch { return undefined; }
                })();
                // Prefer static result if present; otherwise fall back to liveGames matching
                const staticResult = (g as any).result as StaticResult | undefined;
                const staticFinal = typeof (g as any).final === 'string' ? String((g as any).final) : undefined;
                let scoreText: string | null = null;
                if (staticResult && (staticResult.homeScore ?? '') !== '' && (staticResult.awayScore ?? '') !== '') {
                  const hs = staticResult.homeScore as any; const as = staticResult.awayScore as any;
                  scoreText = `${staticResult.away ?? 'Away'} ${as} – ${staticResult.home ?? 'Home'} ${hs}`;
                } else if (staticFinal) {
                  scoreText = staticFinal;
                } else if (lg) {
                  const teams: any[] = Array.isArray((lg as any)?.settings?.teams) ? (lg as any).settings!.teams as any[] : [];
                  const home = teams.find((t: any) => t?.homeAway === 'home') ?? teams[0];
                  const away = teams.find((t: any) => t?.homeAway === 'away') ?? teams[1];
                  const haveScores = home && away && (home?.score ?? '') !== '' && (away?.score ?? '') !== '';
                  scoreText = haveScores ? `${away?.name ?? 'Away'} ${away?.score ?? ''} – ${home?.name ?? 'Home'} ${home?.score ?? ''}` : null;
                }
                const liveStatus = String((lg as any)?.settings?.status ?? '').toLowerCase();
                const isLiveNow = /live|inprogress|in-progress|in/.test(liveStatus);
                return (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-zinc-200 truncate pr-3">{g.name}</span>
                    <span className="shrink-0 text-zinc-400 flex items-center gap-2">
                      {isLiveNow && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] border border-emerald-400/40 text-emerald-200">Live</span>
                      )}
                      {isPast && !isLiveNow ? (scoreText ? `Final: ${scoreText}` : 'Final') : (d ? d.toLocaleString() : 'TBD')}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-2 font-semibold">Stadium Map</h3>
        <StadiumMap />
      </section>
    </div>
  );
}
