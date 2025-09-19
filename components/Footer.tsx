import Link from 'next/link';

export function Footer() {
  // Keep static to avoid hydration differences
  const startYear = 2025;
  const yearText = `${startYear}`;

  return (
    <footer className="border-t border-ecu-purple/40 bg-black/80">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-6 text-sm text-zinc-300 md:grid-cols-4">
        <div>
          <div className="mb-2 font-semibold text-zinc-200">Explore</div>
          <ul className="space-y-1">
            <li><Link href="/gameday" className="hover:text-white">Home</Link></li>
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
          <div className="mb-2 font-semibold text-zinc-200">Help &amp; Support</div>
          <ul className="space-y-1">
            <li><Link href="/support" className="hover:text-white">Support</Link></li>
            <li><Link href="/support/help" className="hover:text-white">Help</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-zinc-200">Legal</div>
          <ul className="space-y-1">
            <li><Link href="/legal/privacy" className="hover:text-white">Privacy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-white">Terms</Link></li>
            {process.env.NODE_ENV !== 'production' && (
              <li><Link href="/mockup" className="hover:text-white">UI Mockup</Link></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-ecu-purple/40 py-4 text-center">
        <div className="text-xs text-zinc-500">© {yearText} Primal Tree</div>
      </div>
    </footer>
  );
}





