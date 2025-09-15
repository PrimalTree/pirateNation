"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';

export default function SignInPage() {
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setAuthed(!!data.user);
    });
    return () => { alive = false; };
  }, [supabase.auth]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    try {
      setStatus('Sending magic link...');
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const emailRedirectTo = origin ? `${origin}/auth/callback` : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo }
      });
      if (error) throw error;
      setStatus('Check your email for the sign-in link.');
    } catch (err: any) {
      setStatus(err?.message || 'Failed to send magic link.');
    }
  }

  useEffect(() => {
    if (!authed) return;
    const id = setTimeout(() => {
      window.location.replace('/app');
    }, 800);
    return () => clearTimeout(id);
  }, [authed]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-bold">Sign up / Sign in</h1>
      {authed ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
          You are signed in. Redirecting to the app...
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="space-y-3">
          <label className="block text-sm text-zinc-300">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-zinc-900 hover:bg-yellow-300"
          >
            Send magic link
          </button>
          {status && <div className="text-sm text-zinc-400">{status}</div>}
        </form>
      )}

      <div className="text-sm text-zinc-500">
        After you click the link in your email, you will be returned here and signed in automatically. From there, we’ll take you to the app.
      </div>
    </div>
  );
}
