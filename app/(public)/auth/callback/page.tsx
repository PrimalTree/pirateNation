"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';

export default function AuthCallback() {
  const [supabase, setSupabase] = useState<any | null>(null);
  const [status, setStatus] = useState('Exchanging code...');

  // Lazily initialize on client to avoid build-time env requirements
  useEffect(() => {
    try { setSupabase(createSupabaseBrowser()); } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) return;
        const url = new URL(window.location.href);
        const err = url.searchParams.get('error');
        const errCode = url.searchParams.get('error_code');
        const errDesc = url.searchParams.get('error_description');
        if (err || errCode) {
          const msg = errDesc?.replace(/\+/g, ' ') || (errCode || err) || 'Sign-in error';
          setStatus(`Error: ${msg}`);
          setTimeout(() => window.location.replace('/auth/signin'), 1200);
          return;
        }
        // Try to exchange code or hash for a session (works for both OAuth and magic links)
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;
        setStatus('Signed in! Redirecting...');
        setTimeout(() => window.location.replace('/gameday'), 500);
        return;
      } catch (e: any) {
        // As a fallback for implicit flows where session is already in URL hash and stored
        if (!supabase) return;
        const { data, error }: any = await supabase.auth.getSession();
        if (data.session && !error) {
          setStatus('Signed in! Redirecting...');
          setTimeout(() => window.location.replace('/gameday'), 500);
          return;
        }
        setStatus(`Error: ${e?.message || 'Sign-in failed'}`);
      }
    })();
  }, [supabase]);

  return <div className="text-white/80">{status}</div>;
}


