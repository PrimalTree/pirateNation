import './globals.css';
import React from 'react';
import { createSupabaseServer } from '@shared/supabase-server';
import { AdminHeader } from './components/AdminHeader';

export const metadata = { title: 'Admin', description: 'Admin UI' };

async function requireAdmin() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false } as const;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  const role = profile?.role ?? 'user';
  const allowed = ['moderator', 'admin', 'sponsor_admin'].includes(role);
  return { allowed, user, role } as const;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const gate = await requireAdmin();
  return (
    <html lang="en">
      <body className="min-h-screen bg-pirate-black text-white">
        <AdminHeader />
        <main className="mx-auto max-w-6xl p-6">
          {gate.allowed ? children : (
            <div className="rounded border border-white/10 p-4 text-white/80">
              <div className="font-semibold">Not authorized</div>
              <p className="mt-2 text-sm">Sign in with a moderator/admin/sponsor_admin account. Use the magic link form in the header.</p>
            </div>
          )}
        </main>
      </body>
    </html>
  );
}


