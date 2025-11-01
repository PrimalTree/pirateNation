"use client";
import React from 'react';

type EventLike = {
  name?: string;
  when?: string;
  status?: string;
  teams?: any[];
  settings?: any;
};

function getName(e: EventLike): string | undefined {
  return (e?.name ?? e?.settings?.name) as string | undefined;
}

function getWhen(e: EventLike): string | undefined {
  return (e?.when ?? e?.settings?.when) as string | undefined;
}

function getStatus(e: EventLike): string | undefined {
  return (e?.status ?? e?.settings?.status) as string | undefined;
}

function getTeams(e: EventLike): any[] {
  const t = (e as any)?.settings?.teams;
  if (Array.isArray(t)) return t;
  const t2 = (e as any)?.teams;
  if (Array.isArray(t2)) return t2;
  return [];
}

function formatScore(e: EventLike): string | null {
  const teams = getTeams(e);
  if (!Array.isArray(teams) || teams.length === 0) return null;
  const home = teams.find((t: any) => t?.homeAway === 'home') ?? teams[0];
  const away = teams.find((t: any) => t?.homeAway === 'away') ?? teams[1];
  if (home && away) return `${away?.name ?? 'Away'} ${away?.score ?? ''} — ${home?.name ?? 'Home'} ${home?.score ?? ''}`;
  return teams.map((t: any) => `${t?.name ?? ''} ${t?.score ?? ''}`).join(' — ');
}

export function ScoreSummary({
  events,
  lastUpdated,
}: {
  events: EventLike[];
  lastUpdated?: number | null;
}) {
  try {
    const isLoading = (!events || events.length === 0) && (lastUpdated === undefined || lastUpdated === null);
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-transparent" aria-label="Loading" />
          <span>Loading live scores…</span>
        </div>
      );
    }
    const arr = Array.isArray(events) ? events : [];
    const isLive = (g: EventLike) => {
      const s = String(getStatus(g) || '').toLowerCase();
      return s === 'in' || s === 'live' || s === 'inprogress' || s === 'in-progress';
    };
    const live = arr.find(isLive) || null;
    const sorted = [...arr]
      .filter((g) => getWhen(g))
      .sort((a, b) => new Date(getWhen(b) as string).getTime() - new Date(getWhen(a) as string).getTime());
    const latest = sorted[0] || null;
    const updated = lastUpdated && Number.isFinite(lastUpdated) ? new Date(lastUpdated).toLocaleTimeString() : null;

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
            <div className="text-zinc-200">{getName(live) ?? ''}</div>
            {formatScore(live) && <div className="text-lg font-semibold text-yellow-200">{formatScore(live)}</div>}
            <div className="text-xs text-zinc-400">{getWhen(live) ? new Date(getWhen(live) as string).toLocaleString() : ''}</div>
          </div>
        )}
        {latest && (!live || latest !== live) && (
          <div>
            <div className="text-xs text-zinc-400">Latest</div>
            <div className="text-zinc-200">{getName(latest) ?? ''}</div>
            {formatScore(latest) && <div className="text-lg font-semibold text-zinc-200">{formatScore(latest)}</div>}
            <div className="text-xs text-zinc-400">{getWhen(latest) ? new Date(getWhen(latest) as string).toLocaleString() : ''}</div>
          </div>
        )}
      </div>
    );
  } catch (e) {
    return <p className="text-sm text-zinc-400">No games available.</p>;
  }
}
