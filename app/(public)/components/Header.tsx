"use client";
import Link from 'next/link';
import { useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';

export function Header() {
  const [email, setEmail] = useState('');
  const supabase = createSupabaseBrowser();

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    alert('Check your email for a sign-in link.');
    setEmail('');
  }

  return (
    <header className="sticky top-0 z-10 w-full border-b border-white/10 bg-black/50 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-ecu-gold" aria-hidden />
          <span className="font-semibold">{process.env.NEXT_PUBLIC_SITE_NAME ?? 'Pirate Nation'}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/map" className="hover:text-ecu-gold">Map</Link>
          <Link href="/players" className="hover:text-ecu-gold">Players</Link>
          <Link href="/sponsors" className="hover:text-ecu-gold">Sponsors</Link>
          <Link href="/profile" className="hover:text-ecu-gold">Profile</Link>
          <Link href="/donate" className="rounded-md bg-ecu-gold px-3 py-1.5 text-black hover:opacity-90">Donate</Link>
        </nav>
      </div>
      <div className="mx-auto max-w-5xl px-4 pb-3 text-xs text-white/80">
        <form onSubmit={sendMagicLink} className="flex items-center gap-2">
          <input
            type="email"
            placeholder="your@email"
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


