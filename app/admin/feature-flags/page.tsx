"use client";
import { useEffect, useState } from 'react';
import { Table, Button } from '@pn/ui';

type Flag = { key: string; description?: string; enabled: boolean };

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [key, setKey] = useState('');
  const [desc, setDesc] = useState('');

  async function load() { const r = await fetch('/api/feature-flags'); setFlags(await r.json()); }
  useEffect(() => { load(); }, []);

  async function createFlag(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/feature-flags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, description: desc }) });
    setKey(''); setDesc('');
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feature Flags</h1>
      <form onSubmit={createFlag} className="space-y-2 rounded border border-white/10 p-3">
        <input className="w-full rounded border border-white/10 bg-black px-3 py-2" placeholder="key" value={key} onChange={e=>setKey(e.target.value)} />
        <input className="w-full rounded border border-white/10 bg-black px-3 py-2" placeholder="description" value={desc} onChange={e=>setDesc(e.target.value)} />
        <Button type="submit" className="bg-ecu-purple">Create</Button>
      </form>
      <Table columns={[{ key: 'key', header: 'Key' }, { key: 'enabled', header: 'Enabled' }]} data={flags} total={flags.length} />
    </div>
  );
}
