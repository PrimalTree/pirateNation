import React from 'react';
import { TopBar } from '../(public)/components/TopBar';
import { SponsorBanner } from '../(public)/components/SponsorBanner';
import { BottomNav } from '../(public)/components/BottomNav';
import { Footer } from '../(public)/components/Footer';
import { PWARegister } from '../(public)/components/PWARegister';
import { FlagOverlayProvider } from '../(public)/components/FlagOverlayContext';
import { FlagOverlay } from '../(public)/components/FlagOverlay';
import { createSupabaseServer } from '@shared/supabase-server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Pirate Nation App',
  description: 'Authenticated app area'
};

async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin');
  return user;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <FlagOverlayProvider>
      <div suppressHydrationWarning>
        <TopBar />
      </div>
      <SponsorBanner />
      <main className="mx-auto max-w-6xl p-6">{children}</main>
      <Footer />
      <div className="h-20 md:hidden" aria-hidden />
      <PWARegister />
      <BottomNav />
      <FlagOverlay />
    </FlagOverlayProvider>
  );
}
