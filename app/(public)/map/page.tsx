import mapData from '../../data/public/map.json';

export default function MapPage() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  // Derive a center from the first area (or fallback)
  const areas = Array.isArray((mapData as any)?.areas) ? (mapData as any).areas : [];
  const first = areas[0]?.coords as [number, number] | undefined; // [lat, lon]
  const centerLat = typeof first?.[0] === 'number' ? first![0] : 35.595;
  const centerLon = typeof first?.[1] === 'number' ? first![1] : -77.366;

  // Build simple pin overlays for key areas
  const pins = areas
    .slice(0, 10)
    .map((a: any) => {
      const [lat, lon] = a.coords || [];
      if (typeof lat !== 'number' || typeof lon !== 'number') return null;
      // Mapbox expects lon,lat — use yellow pins
      return `pin-s+fde047(${lon},${lat})`;
    })
    .filter(Boolean)
    .join(',');

  const staticBase = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static';
  const overlay = pins ? `${pins}/` : '';
  const zoom = 15;
  const size = '1280x720@2x';
  const staticUrl = token
    ? `${staticBase}/${overlay}${centerLon},${centerLat},${zoom},0/${size}?access_token=${encodeURIComponent(
        token
      )}`
    : null;

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Interactive Stadium Map</h1>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        {staticUrl ? (
          <a href={staticUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={staticUrl}
              alt="Stadium map overview"
              className="aspect-[16/9] w-full rounded-xl border border-zinc-700 object-cover"
              loading="eager"
            />
          </a>
        ) : (
          <div className="grid place-items-center aspect-[16/9] w-full rounded-xl border border-zinc-700 bg-zinc-800 text-center text-zinc-400">
            <div>
              <div className="font-medium text-zinc-200">Map not configured</div>
              <div className="mt-1 text-sm">Set NEXT_PUBLIC_MAPBOX_TOKEN in your .env to enable the map.</div>
            </div>
          </div>
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[{ name: 'Seating', desc: 'Tap section to view.' }, { name: 'Concessions', desc: 'Find nearest stands.' }, { name: 'Restrooms', desc: 'Nearest facilities.' }, { name: 'First Aid', desc: 'Medical tent.' }].map((f, i) => (
            <div key={i} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-3">
              <div className="font-medium">{f.name}</div>
              <div className="text-xs text-zinc-400">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="font-semibold">Parking & Shuttle Info</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[{ title: 'Gold Lot', detail: 'Open 1:00 PM  $20' }, { title: 'Purple Lot', detail: 'Pass holders only' }, { title: 'Shuttle A', detail: 'Every 10 min from Downtown' }].map((p, i) => (
            <div key={i} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-3">
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-zinc-400">{p.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
