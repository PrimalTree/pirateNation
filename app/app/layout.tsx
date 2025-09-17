import React from 'react';
import { TopBar } from '../../components/TopBar';
import { SponsorBanner } from '../../components/support/SponsorBanner';
import { BottomNav } from '../../components/BottomNav';
import { Footer } from '../../components/Footer';
import { PWARegister } from '../../components/PWARegister';
import { FlagOverlayProvider } from '../../components/gameday/FlagOverlayContext';
import { FlagOverlay } from '../../components/gameday/FlagOverlay';
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
