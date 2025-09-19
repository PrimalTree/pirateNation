"use client";
import Link from 'next/link';
import ClientOnly from '../../components/ClientOnly';
import { Button } from '../../../packages/ui/src/lib/Button';
import { FanVote } from '../../../components/engage/FanVote';
import { QuickPoll } from '../../../components/engage/QuickPoll';

function Glow() {
  return (
    <>
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl" />
    </>
  );
}

function PlaceholderCard({ className = '' }: { className?: string }) {
  return <div className={`h-32 w-48 rounded-lg bg-zinc-800 ${className}`}></div>;
}

export default function Page() {
  return (
    <div className="space-y-8" suppressHydrationWarning>
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
        <Glow />
        <div className="relative z-10 grid items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              <ClientOnly>User Engagement Feed</ClientOnly>
            </h1>
            <p className="mt-2 max-w-prose text-zinc-300">Engage with the community and get the latest updates.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Fan Vote: OMVP / DMVP</h3>
        </div>
        <FanVote />
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Quick Poll</h3>
        <QuickPoll options={[{ key: 'pirates', label: 'Pirates' }, { key: 'opponent', label: 'Opponent' }]} />
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-2 font-semibold">Plunder (In-game score)</h3>
        <div className="h-48 rounded-lg bg-zinc-800"></div>
      </section>

      <section>
        <h3 className="mb-2 font-semibold">In The Socials</h3>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          <PlaceholderCard />
          <PlaceholderCard />
          <PlaceholderCard />
          <PlaceholderCard />
        </div>
      </section>
    </div>
  );
}
