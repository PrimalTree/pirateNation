"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '../../lib/supabase-browser';

export default function ProfilePage() {
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
  }, [supabase.auth]);

  async function signOut() {
    await supabase.auth.signOut();
    location.reload();
  }

  if (loading) return <div>Loading...</div>;
  if (!email) return <div className="text-white/80">Not signed in. Use the header to request a magic link.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Profile</h1>
      <div className="rounded border border-white/10 p-4">
        <div>Email: {email}</div>
      </div>
      <button onClick={signOut} className="rounded bg-ecu-purple px-3 py-1 text-white hover:opacity-90">Sign out</button>
    </div>
  );
}

