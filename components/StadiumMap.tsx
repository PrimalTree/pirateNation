import stadiumMap from '../data/public/map.json';

export function StadiumMap() {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const areas: any[] = Array.isArray((stadiumMap as any)?.areas) ? (stadiumMap as any).areas : [];
    const first = areas[0]?.coords as [number, number] | undefined;
    const centerLat = typeof first?.[0] === 'number' ? first![0] : 35.595;
    const centerLon = typeof first?.[1] === 'number' ? first![1] : -77.366;
    const pins = areas
      .slice(0, 10)
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
    const staticUrl = token
      ? `${staticBase}/${overlay}${centerLon},${centerLat},${zoom},0/${size}?access_token=${encodeURIComponent(token)}`
      : null;
    if (!staticUrl) {
      return <div className="text-sm text-zinc-400">Map not configured.</div>;
    }
    return (
      <a href={staticUrl} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={staticUrl}
          alt="Stadium map overview"
          className="aspect-[16/9] w-full rounded-xl border border-zinc-700 object-cover"
          loading="lazy"
        />
      </a>
    );
  } catch {
    return <div className="text-sm text-zinc-400">Map unavailable.</div>;
  }
}

