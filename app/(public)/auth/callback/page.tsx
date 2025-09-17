"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';

export default function AuthCallback() {
  const supabase = createSupabaseBrowser();
  const [status, setStatus] = useState('Exchanging code...');

  useEffect(() => {
    (async () => {
      try {
        // Try to exchange code or hash for a session (works for both OAuth and magic links)
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;
        setStatus('Signed in! Redirecting...');
        setTimeout(() => window.location.replace('/app'), 500);
        return;
      } catch (e: any) {
        // As a fallback for implicit flows where session is already in URL hash and stored
        const { data, error } = await supabase.auth.getSession();
        if (data.session && !error) {
          setStatus('Signed in! Redirecting...');
          setTimeout(() => window.location.replace('/app'), 500);
          return;
        }
        setStatus(`Error: ${e?.message || 'Sign-in failed'}`);
      }
    })();
  }, [supabase.auth]);

  return <div className="text-white/80">{status}</div>;
}



