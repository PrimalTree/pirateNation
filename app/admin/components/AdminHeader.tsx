"use client";
import Link from 'next/link';
import { useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';

export function AdminHeader() {
  const [email, setEmail] = useState('');
  const supabase = createSupabaseBrowser();

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    alert('Check your email for a sign-in link.');
    setEmail('');
  }

  return (
    <header className="sticky top-0 z-10 w-full border-b border-white/10 bg-black/50 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-ecu-purple" aria-hidden />
          <span className="font-semibold">Admin</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-ecu-gold">Dashboard</Link>
          <Link href="/polls" className="hover:text-ecu-gold">Polls</Link>
          <Link href="/ugc-queue" className="hover:text-ecu-gold">UGC Queue</Link>
          <Link href="/sponsors" className="hover:text-ecu-gold">Sponsors</Link>
          <Link href="/push" className="hover:text-ecu-gold">Push</Link>
          <Link href="/map-layers" className="hover:text-ecu-gold">Map Layers</Link>
          <Link href="/feature-flags" className="hover:text-ecu-gold">Feature Flags</Link>
          <Link href="/live" className="hover:text-ecu-gold">Live</Link>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-3 text-xs text-white/80">
        <form onSubmit={sendMagicLink} className="flex items-center gap-2">
          <input
            type="email"
            placeholder="admin@email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-64 rounded-md border border-white/10 bg-black px-3 py-1 text-white placeholder-white/40 focus:border-ecu-gold focus:outline-none"
          />
          <button className="rounded-md bg-ecu-purple px-3 py-1 text-white hover:opacity-90" type="submit">Magic Link</button>
        </form>
      </div>
    </header>
  );
}


