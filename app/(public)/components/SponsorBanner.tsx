export function SponsorBanner() {
  const sponsors = [
    { name: 'Sup Dogs', logo: 'SD' },
    { name: 'Pirate Coffee Co.', logo: 'PC' },
    { name: 'Downtown Deli', logo: 'DD' },
    { name: 'Greenville Fitness', logo: 'GF' },
    { name: 'Uptown Pub', logo: 'UP' }
  ];
  return (
    <div className="border-b border-zinc-800 bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2">
        <div className="shrink-0 text-xs uppercase tracking-widest text-zinc-400">
          Pirate Nation 2025 <span className="text-zinc-200">Sponsored by</span>:
        </div>
        <div className="flex flex-wrap gap-3">
          {sponsors.map((s, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1" title={s.name}>
              <div className="grid h-6 w-6 place-items-center rounded-full bg-zinc-800 text-xs text-zinc-200 ring-1 ring-zinc-700">{s.logo}</div>
              <span className="text-xs text-zinc-300">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

