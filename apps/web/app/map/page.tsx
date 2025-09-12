export default function MapPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Interactive Stadium Map</h1>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="grid place-items-center aspect-[16/9] w-full rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-400">
          Map placeholder (plug Mapbox/Leaflet)
        </div>
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
