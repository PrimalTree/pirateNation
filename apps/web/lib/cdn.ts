"use client";

// Session-scoped JSON fetcher for CDN-style endpoints
// Uses sessionStorage to avoid re-fetching during a session

async function fetchJsonOnce<T>(path: string, key: string): Promise<T> {
  try {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(key);
      if (cached) return JSON.parse(cached) as T;
    }
  } catch {}

  const res = await fetch(path, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  const data = (await res.json()) as T;
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, JSON.stringify(data));
    }
  } catch {}
  return data;
}

export function getSchedule() {
  return fetchJsonOnce<{ season: number; games: any[] }>(
    '/api/public/schedule.json',
    'cdn.schedule.v1'
  );
}

export function getRoster() {
  return fetchJsonOnce<{ season: number; team: string; players: any[] }>(
    '/api/public/roster.json',
    'cdn.roster.v1'
  );
}

export function getMapData() {
  return fetchJsonOnce<{ stadium: string; areas: any[] }>(
    '/api/public/map.json',
    'cdn.map.v1'
  );
}

