"use client";
import { useEffect, useMemo, useRef, useState } from 'react';

type Announcement = {
  id: string;
  text: string;
  url?: string;
  level?: 'info' | 'warning' | 'alert';
  starts_at?: string;
  ends_at?: string;
};

function isActive(a: Announcement, now: number) {
  try {
    const start = a.starts_at ? new Date(a.starts_at).getTime() : -Infinity;
    const end = a.ends_at ? new Date(a.ends_at).getTime() : Infinity;
    return now >= start && now <= end;
  } catch { return true; }
}

export function AnnouncementsBar() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [idx, setIdx] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/public/announcements', { cache: 'no-store' });
        const json = await res.json();
        if (!alive) return;
        const now = Date.now();
        const all: Announcement[] = Array.isArray(json?.items) ? json.items : [];
        const active = all.filter((a) => isActive(a, now));
        setItems(active);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!items.length) return;
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 5000);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [items.length]);

  const current = items.length ? items[idx] : null;
  if (!current) return null;

  const level = current.level || 'info';
  const styles = level === 'alert'
    ? 'border-red-500/40 bg-red-500/10 text-red-200'
    : level === 'warning'
      ? 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200'
      : 'border-ecu-purple/40 bg-black/60 text-zinc-200';

  const content = (
    <div className="mx-auto max-w-6xl truncate px-4 py-2 text-sm">
      {current.text}
    </div>
  );

  return (
    <div className={["border-b", styles].join(' ')}>
      {current.url ? (
        <a href={current.url} className="block hover:underline" target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : content}
    </div>
  );
}

