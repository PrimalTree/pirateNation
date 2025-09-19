


"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';

export default function SignInPage() {
  const supabase = createSupabaseBrowser();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [status, setStatus] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  // shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // signup-only fields
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setAuthed(!!data.user);
    });
    return () => { alive = false; };
  }, [supabase.auth]);

  async function doSignIn(e: React.FormEvent) {
    e.preventDefault();
    try {
      setStatus('Signing in…');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setStatus('Signed in. Redirecting…');
      setTimeout(() => window.location.replace('/app'), 600);
    } catch (err: any) {
      setStatus(err?.message || 'Sign-in failed');
    }
  }

  async function doSignUp(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!name.trim() || !dob || !username.trim() || !email.trim() || !password) {
        setStatus('Please fill all required fields.');
        return;
      }
      setStatus('Creating your account…');
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const emailRedirectTo = origin ? `${origin}/auth/signin` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      });
      if (error) throw error;
      // Insert/update the user's profile entry immediately if we have the user id,
      // otherwise defer until first sign-in (pending_profile).
      try {
        const immediateId = data.user?.id;
        if (immediateId) {
          await supabase.from('profiles').upsert({
            user_id: immediateId,
            role: 'user',
            display_name: name,
            metadata: { dob, username }
          }, { onConflict: 'user_id' });
        }
        // Also set pending locally in case RLS/session prevents immediate write; will retry on first sign-in
        localStorage.setItem('pending_profile', JSON.stringify({ name, dob, username }));
      } catch {}
      setStatus('Account created. Check your email to verify, then sign in.');
      setMode('signin');
    } catch (err: any) {
      setStatus(err?.message || 'Sign-up failed');
    }
  }

  useEffect(() => {
    // If there is a pending profile and user just signed in, apply it
    (async () => {
      try {
        const raw = localStorage.getItem('pending_profile');
        if (!raw) return;
        const sess = await supabase.auth.getSession();
        if (!sess.data.session) return;
        const data = JSON.parse(raw);
        await supabase.from('profiles').upsert({
          user_id: sess.data.session.user.id,
          role: 'user',
          display_name: data?.name ?? null,
          metadata: { dob: data?.dob, username: data?.username }
        }, { onConflict: 'user_id' });
        localStorage.removeItem('pending_profile');
      } catch {}
    })();
  }, [supabase.auth]);

  useEffect(() => {
    if (!authed) return;
    const id = setTimeout(() => { window.location.replace('/app'); }, 800);
    return () => clearTimeout(id);
  }, [authed]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-bold">{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>

      <div className="flex gap-2 text-sm">
        <button
          className={["rounded-md px-3 py-1", mode === 'signin' ? 'bg-ecu-gold text-black' : 'border border-zinc-700 text-zinc-200'].join(' ')}
          onClick={() => setMode('signin')}
          type="button"
        >
          Sign in
        </button>
        <button
          className={["rounded-md px-3 py-1", mode === 'signup' ? 'bg-ecu-gold text-black' : 'border border-zinc-700 text-zinc-200'].join(' ')}
          onClick={() => setMode('signup')}
          type="button"
        >
          Sign up
        </button>
      </div>

      {authed ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
          You are signed in. Redirecting to the app…
        </div>
      ) : mode === 'signin' ? (
        <form onSubmit={doSignIn} className="space-y-3">
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
          <label className="block text-sm text-zinc-300">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="w-full rounded-xl bg-ecu-gold px-4 py-2 font-semibold text-black hover:opacity-90">Sign in</button>
          {status && <div className="text-sm text-zinc-400">{status}</div>}
        </form>
      ) : (
        <form onSubmit={doSignUp} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm text-zinc-300">
              Name
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
                placeholder="Your full name"
              />
            </label>
            <label className="block text-sm text-zinc-300">
              DOB
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
              />
            </label>
          </div>
          <label className="block text-sm text-zinc-300">
            Username
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
              placeholder="piratefan123"
            />
          </label>
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
          <label className="block text-sm text-zinc-300">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
              placeholder="••••••••"
              minLength={8}
            />
          </label>
          <button type="submit" className="w-full rounded-xl bg-ecu-gold px-4 py-2 font-semibold text-black hover:opacity-90">Create account</button>
          {status && <div className="text-sm text-zinc-400">{status}</div>}
        </form>
      )}
    </div>
  );
}
