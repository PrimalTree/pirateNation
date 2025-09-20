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
          <li><Link href="/start" className="hover:text-white">Start</Link></li>
            <li><Link href="/gameday" className="hover:text-white">Home</Link></li>

          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-zinc-200">Community</div>
          <ul className="space-y-1">
            <li><Link href="/engage" className="hover:text-white">Engage</Link></li>
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
          </ul>
        </div>
      </div>
      <div className="border-t border-ecu-purple/40 py-4 text-center">
        <div className="text-xs text-zinc-500">© {yearText} Primal Tree</div>
      </div>
    </footer>
  );
}





