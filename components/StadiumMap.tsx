"use client";
import { useMemo, useRef, useState } from 'react';
import stadiumMap from '../data/public/map.json';

export function StadiumMap() {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const areas: any[] = Array.isArray((stadiumMap as any)?.areas) ? (stadiumMap as any).areas : [];
    const first = areas[0]?.coords as [number, number] | undefined;
    const centerLat = typeof first?.[0] === 'number' ? first![0] : 35.595;
    const centerLon = typeof first?.[1] === 'number' ? first![1] : -77.366;
    const pins = areas
      .slice(0, 20)
      .map((a: any) => {
        const [lat, lon] = a.coords || [];
        if (typeof lat !== 'number' || typeof lon !== 'number') return null;
        return `pin-s+fde047(${lon},${lat})`;
      })
      .filter(Boolean)
      .join(',');
    const staticBase = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static';
    const overlay = pins ? `${pins}/` : '';
    const zoom = 15;
    const size = '1280x720@2x';
    const staticUrl = useMemo(() => (
      token ? `${staticBase}/${overlay}${centerLon},${centerLat},${zoom},0/${size}?access_token=${encodeURIComponent(token)}` : null
    ), [token]);

    if (!staticUrl) return <div className="text-sm text-zinc-400">Map not configured.</div>;

    // Simple interactive pan/zoom for the static image
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const drag = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

    function onWheel(e: React.WheelEvent) {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      const next = Math.min(3, Math.max(1, scale * factor));
      setScale(next);
    }
    function onMouseDown(e: React.MouseEvent) {
      drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y, active: true };
    }
    function onMouseMove(e: React.MouseEvent) {
      if (!drag.current.active) return;
      setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
    }
    function onMouseUp() { drag.current.active = false; }

    return (
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-zinc-700"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: drag.current.active ? 'grabbing' : 'grab' }}
      >
        <img
          src={staticUrl}
          alt="Stadium map overview"
          className="select-none"
          draggable={false}
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, transformOrigin: 'center center' }}
        />
      </div>
    );
  } catch {
    return <div className="text-sm text-zinc-400">Map unavailable.</div>;
  }
}
