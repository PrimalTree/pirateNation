import React from 'react';
import { TopBar } from '@components/TopBar';
import { AnnouncementsBar } from '@components/AnnouncementsBar';
import { SponsorBanner } from '@components/support/SponsorBanner';
import { BottomNav } from '@components/BottomNav';
import { Footer } from '@components/Footer';
import { PWARegister } from '@components/PWARegister';

export const metadata = {
  title: 'Pirate Nation Web',
  description: 'Web app stub'
};


export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div>
        <TopBar />
      </div>
      <SponsorBanner />
      <main className="mx-auto max-w-6xl p-6">{children}</main>
      <Footer />
      {/* Move announcements below footer so it appears under "Powered by Primal Tree" */}
      <AnnouncementsBar />
      {/* Spacer so footer isn't hidden behind fixed BottomNav on small screens */}
      <div className="h-20 md:hidden" aria-hidden />
      <PWARegister />
      <BottomNav />
    </div>
  );
}
