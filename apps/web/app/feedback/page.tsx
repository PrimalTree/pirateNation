"use client";
import { useState } from 'react';

export default function FeedbackPage() {
  const [text, setText] = useState('');
  const mailto = `mailto:support@example.com?subject=${encodeURIComponent('Pirate Nation Feedback')}&body=${encodeURIComponent(text)}`;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Feedback / Bug Report</h1>
      <p className="text-zinc-400">Tell us what worked, what didn’t, or any ideas to improve.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100" placeholder="Describe the issue or share your idea..." />
      <div className="flex gap-2">
        <a href={mailto} className="rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-zinc-900">Send Email</a>
        <button onClick={() => { navigator.clipboard.writeText(text).catch(()=>{}); }} className="rounded-xl border border-zinc-700 px-4 py-2 text-zinc-200 hover:bg-zinc-800">Copy Text</button>
      </div>
      <p className="text-xs text-zinc-500">We’ll add in‑app submission later; email is the MVP route.</p>
    </div>
  );
}

