import './globals.css';
import React from 'react';
import { Header } from './components/Header';

export const metadata = {
  title: 'Pirate Nation Web',
  description: 'Web app stub'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-pirate-black text-white">
        <Header />
        <main className="mx-auto max-w-5xl p-6">{children}</main>
      </body>
    </html>
  );
}
