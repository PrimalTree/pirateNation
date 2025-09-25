"use client";
import { useEffect, useState } from 'react';
import { Table, Button } from '@pn/ui';

type Poll = { id: string; question: string; options: string[]; is_active: boolean };

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState('');

  useEffect(() => { fetch('/api/polls').then(r => r.json()).then(setPolls); }, []);

  async function createPoll(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options: options.split(',').map(s => s.trim()).filter(Boolean) })
    });
    setQuestion(''); setOptions('');
    // Refresh list
    try { const list = await fetch('/api/polls').then(r => r.json()); setPolls(Array.isArray(list) ? list : []); } catch {}
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Polls</h1>
      <form onSubmit={createPoll} className="space-y-2 rounded border border-white/10 p-3">
        <div className="text-sm font-medium">Create Poll</div>
        <input className="w-full rounded border border-white/10 bg-black px-3 py-2" placeholder="Question" value={question} onChange={e=>setQuestion(e.target.value)} />
        <input className="w-full rounded border border-white/10 bg-black px-3 py-2" placeholder="Options (comma separated)" value={options} onChange={e=>setOptions(e.target.value)} />
        <Button type="submit" className="bg-ecu-purple">Create</Button>
      </form>
      <Table columns={[{ key: 'question', header: 'Question' }, { key: 'options', header: 'Options', render: (p)=>p.options?.join(', ') }]} data={polls} total={polls.length} />
    </div>
  );
}
