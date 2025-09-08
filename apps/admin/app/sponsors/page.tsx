"use client";
import { useEffect, useState } from 'react';
import { Table, Button } from '@pn/ui';

type Sponsor = { id: string; name: string; website_url?: string; flight_start?: string; flight_end?: string };

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  async function load() { const r = await fetch('/api/sponsors'); setSponsors(await r.json()); }
  useEffect(() => { load(); }, []);

  async function createSponsor(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/sponsors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, website_url: website, flight_start: start, flight_end: end }) });
    setName(''); setWebsite(''); setStart(''); setEnd('');
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sponsors</h1>
      <form onSubmit={createSponsor} className="grid grid-cols-1 gap-2 rounded border border-white/10 p-3 sm:grid-cols-2">
        <input className="rounded border border-white/10 bg-black px-3 py-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="rounded border border-white/10 bg-black px-3 py-2" placeholder="Website URL" value={website} onChange={e=>setWebsite(e.target.value)} />
        <input type="datetime-local" className="rounded border border-white/10 bg-black px-3 py-2" value={start} onChange={e=>setStart(e.target.value)} />
        <input type="datetime-local" className="rounded border border-white/10 bg-black px-3 py-2" value={end} onChange={e=>setEnd(e.target.value)} />
        <div className="sm:col-span-2"><Button type="submit" className="bg-ecu-purple">Create</Button></div>
      </form>
      <Table columns={[{ key: 'name', header: 'Name' }, { key: 'website_url', header: 'Website' }, { key: 'flight_start', header: 'Start' }, { key: 'flight_end', header: 'End' }]} data={sponsors} total={sponsors.length} />
    </div>
  );
}
