import Link from 'next/link';

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 via-purple-400 to-yellow-400" />
          <span className="font-semibold tracking-wide">{process.env.NEXT_PUBLIC_SITE_NAME ?? 'Pirate Nation'}</span>
          <span className="ml-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-300">Beta</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/map" className="text-zinc-300 hover:text-white">Map</Link>
          <Link href="/players" className="text-zinc-300 hover:text-white">Players</Link>
          <Link href="/polls" className="text-zinc-300 hover:text-white">Polls</Link>
          <Link href="/sponsors" className="text-zinc-300 hover:text-white">Sponsors</Link>
          <Link href="/feedback" className="text-zinc-300 hover:text-white">Feedback</Link>
          <Link href="/donate" className="text-zinc-300 hover:text-white">Donate</Link>
        </nav>
      </div>
    </header>
  );
}
