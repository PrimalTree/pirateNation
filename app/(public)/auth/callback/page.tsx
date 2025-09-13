"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';

export default function AuthCallback() {
  const supabase = createSupabaseBrowser();
  const [status, setStatus] = useState('Exchanging code...');

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href)
      .then(({ error }) => {
        if (error) {
          setStatus(`Error: ${error.message}`);
        } else {
          setStatus('Signed in! Redirecting...');
          setTimeout(() => {
            window.location.replace('/profile');
          }, 500);
        }
      });
  }, [supabase.auth]);

  return <div className="text-white/80">{status}</div>;
}



