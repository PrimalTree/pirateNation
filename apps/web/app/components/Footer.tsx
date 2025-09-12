import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/70">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-6 text-sm text-zinc-300 md:grid-cols-4">
        <div>
          <div className="mb-2 font-semibold text-zinc-200">Explore</div>
          <ul className="space-y-1">
            <li><Link href="/" className="hover:text-white">Home</Link></li>
            <li><Link href="/map" className="hover:text-white">Map</Link></li>
            <li><Link href="/polls" className="hover:text-white">Polls</Link></li>
            <li><Link href="/sponsors" className="hover:text-white">Sponsors</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-zinc-200">Community</div>
          <ul className="space-y-1">
            <li><Link href="/players" className="hover:text-white">Players</Link></li>
            <li><Link href="/feedback" className="hover:text-white">Feedback</Link></li>
            <li><Link href="/profile" className="hover:text-white">Profile</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-zinc-200">Support</div>
          <ul className="space-y-1">
            <li><Link href="/donate" className="hover:text-white">Donate</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-zinc-200">Legal</div>
          <ul className="space-y-1">
            <li><Link href="/legal/privacy" className="hover:text-white">Privacy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-white">Terms</Link></li>
            <li><Link href="/mockup" className="hover:text-white">UI Mockup</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-500">
        {(() => {
          const startYear = 2025;
          const currentYear = new Date().getFullYear();
          const yearText = currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`;
          return `© ${yearText} Primal Tree`;
        })()}
      </div>
    </footer>
  );
}
