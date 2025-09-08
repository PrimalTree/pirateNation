"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '../../../lib/supabase-browser';

export default function AuthCallback() {
  const supabase = createSupabaseBrowser();
  const [status, setStatus] = useState('Exchanging code...');

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href)
      .then(({ error }) => {
        if (error) setStatus(`Error: ${error.message}`);
        else {
          setStatus('Signed in! Redirecting...');
          setTimeout(() => window.location.replace('/'), 500);
        }
      });
  }, []);

  return <div className="text-white/80">{status}</div>;
}

