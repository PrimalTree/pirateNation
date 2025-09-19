"use client";
import { useState } from 'react';

type Category = 'bug' | 'idea' | 'other';

export default function FeedbackPage() {
  const [category, setCategory] = useState<Category>('bug');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [includeMeta, setIncludeMeta] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  function buildBody() {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const meta = includeMeta ? `\n\n---\nUser agent: ${ua}\nURL: ${url}` : '';
    return `[${category.toUpperCase()}]` + "\n\n" + message + meta;
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildBody());
      setStatus('Copied to clipboard');
      setTimeout(() => setStatus(null), 2000);
    } catch {
      setStatus('Copy failed');
      setTimeout(() => setStatus(null), 2000);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatus('Sending…');
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          category,
          email: email || undefined,
          message,
          meta: includeMeta ? { userAgent: navigator.userAgent, url: location.href } : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => 'Error'));
      setStatus('Thanks! Your feedback was submitted.');
      setMessage('');
      setTimeout(() => setStatus(null), 2500);
    } catch (err: any) {
      setStatus(err?.message || 'Failed to submit');
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const mailto = (() => {
    const base = 'mailto:support@example.com?subject=' + encodeURIComponent('Pirate Nation Feedback');
    try {
      return base + '&body=' + encodeURIComponent(buildBody());
    } catch {
      return base;
    }
  })();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-bold">Feedback / Bug Report</h1>
      <p className="text-zinc-400">Tell us what worked, what didn’t, or any ideas to improve.</p>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block text-sm text-zinc-300">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
            >
              <option value="bug">Bug</option>
              <option value="idea">Idea</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm text-zinc-300">
            Email (optional)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
            />
          </label>
        </div>

        <label className="block text-sm text-zinc-300">
          Message
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100"
            placeholder="Describe the issue or share your idea…"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={includeMeta} onChange={(e) => setIncludeMeta(e.target.checked)} />
          Include device details (user agent, URL)
        </label>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            className="rounded-xl bg-ecu-gold px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            Submit
          </button>
          <a
            href={mailto}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Send via Email
          </a>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Copy Text
          </button>
        </div>
        {status && <div className="text-xs text-zinc-400">{status}</div>}
      </form>
    </div>
  );
}
