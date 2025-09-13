"use client";
import { useEffect, useState } from 'react';
import { Table, Button } from '@pn/ui';

type UGC = { id: string; title: string; status: string };

export default function UGCQueuePage() {
  const [posts, setPosts] = useState<UGC[]>([]);
  useEffect(() => { fetch('/api/ugc').then(r => r.json()).then(setPosts); }, []);

  async function act(id: string, action: 'approve'|'reject') {
    await fetch(`/api/ugc/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">UGC Queue</h1>
      <Table
        columns={[
          { key: 'title', header: 'Title' },
          { key: 'status', header: 'Status' },
          { key: 'actions', header: 'Actions', render: (p)=> (
            <div className="flex gap-2">
              <Button className="bg-ecu-gold text-black" onClick={()=>act(p.id,'approve')}>Approve</Button>
              <Button variant="ghost" onClick={()=>act(p.id,'reject')}>Reject</Button>
            </div>
          )}
        ]}
        data={posts}
        total={posts.length}
      />
    </div>
  );
}
