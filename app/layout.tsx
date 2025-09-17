import './(public)/globals.css';
import React from 'react';

export const metadata = {
  title: 'Pirate Nation Web',
  description: 'Web app stub',
  icons: {
    icon: [
      { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png' }],
    other: [{ rel: 'mask-icon', url: '/icons/monochrome-icon.svg', color: '#fde047' }],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: light)', color: '#fde047' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-zinc-100">{children}</body>
    </html>
  );
}

