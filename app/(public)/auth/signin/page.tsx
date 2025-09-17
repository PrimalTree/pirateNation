"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';

export default function SignInPage() {
  const supabase = createSupabaseBrowser();
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

  async function signInWith(provider: 'google' | 'apple') {
    try {
      setStatus(`Redirecting to ${provider}…`);
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const redirectTo = origin ? `${origin}/auth/callback` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo }
      });
      if (error) throw error;
    } catch (err: any) {
      setStatus(err?.message || 'Unable to start OAuth flow.');
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
      <h1 className="text-3xl font-bold">Sign in</h1>
      {authed ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
          You are signed in. Redirecting to the app...
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => signInWith('google')}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 hover:bg-zinc-800"
          >
            Continue with Google
          </button>
          <button
            onClick={() => signInWith('apple')}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 hover:bg-zinc-800"
          >
            Continue with Apple
          </button>
          {status && <div className="text-sm text-zinc-400">{status}</div>}
        </div>
      )}

      <div className="text-xs text-zinc-500">
        Ensure the provider is enabled in your Supabase project and the redirect URL is set to /auth/callback.
      </div>
    </div>
  );
}
