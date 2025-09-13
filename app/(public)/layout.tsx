import './globals.css';
import React from 'react';
import { TopBar } from './components/TopBar';
import { SponsorBanner } from './components/SponsorBanner';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { PWARegister } from './components/PWARegister';
import { FlagOverlayProvider } from './components/FlagOverlayContext';
import { FlagOverlay } from './components/FlagOverlay';

export const metadata = {
  title: 'Pirate Nation Web',
  description: 'Web app stub'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#fde047" media="(prefers-color-scheme: light)" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icons/icon-192.svg" sizes="192x192" type="image/svg+xml" />
        <link rel="icon" href="/icons/icon-512.svg" sizes="512x512" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="mask-icon" href="/icons/monochrome-icon.svg" color="#fde047" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <FlagOverlayProvider>
          <TopBar />
          <SponsorBanner />
          <main className="mx-auto max-w-6xl p-6">{children}</main>
          <Footer />
          {/* Spacer so footer isn't hidden behind fixed BottomNav on small screens */}
          <div className="h-20 md:hidden" aria-hidden />
          <PWARegister />
          <BottomNav />
          <FlagOverlay />
        </FlagOverlayProvider>
      </body>
    </html>
  );
}
