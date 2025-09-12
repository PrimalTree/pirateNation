"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flag, Map, Megaphone, HandCoins, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useFlagOverlay } from './FlagOverlayContext';
import { useEffect, useRef } from 'react';

export function BottomNav() {
  const pathname = usePathname();
  const { open } = useFlagOverlay();
  const navRef = useRef<HTMLElement | null>(null);

  // Ensure page content has padding equal to the BottomNav height
  useEffect(() => {
    function updatePadding() {
      const el = navRef.current;
      if (!el) return;
      const style = window.getComputedStyle(el);
      const hidden = style.display === 'none' || style.visibility === 'hidden';
      if (hidden) {
        document.body.style.paddingBottom = '';
      } else {
        const h = el.offsetHeight;
        document.body.style.paddingBottom = `${h}px`;
      }
    }
    updatePadding();
    const ro = new ResizeObserver(() => updatePadding());
    if (navRef.current) ro.observe(navRef.current);
    window.addEventListener('resize', updatePadding);
    window.addEventListener('orientationchange', updatePadding);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updatePadding);
      window.removeEventListener('orientationchange', updatePadding);
      document.body.style.paddingBottom = '';
    };
  }, []);

  const Item = ({ href, label, Icon }: { href: string; label: string; Icon: any }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={[
          'flex flex-1 flex-col items-center justify-center gap-1 py-2',
          active ? 'text-yellow-300' : 'text-zinc-400 hover:text-zinc-200'
        ].join(' ')}
      >
        <Icon className="h-5 w-5" />
        <span className="text-xs">{label}</span>
      </Link>
    );
  };

  return (
    <nav ref={navRef} className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-5 px-2">
        <Item href="/" label="Home" Icon={Home} />
        <Item href="/map" label="Map" Icon={Map} />
        <button onClick={open} className="-mt-5 flex flex-col items-center justify-center" aria-label="Raise Flag">
          <motion.div
            className="flex h-14 w-14 items-center justify-center rounded-full border border-purple-400/20 bg-purple-600/30 shadow-lg"
            whileTap={{ scale: 0.95 }}
          >
            <Flag className="h-6 w-6 text-purple-200" />
          </motion.div>
          <span className="mt-1 text-xs text-purple-200">Flag</span>
        </button>
        <Item href="/polls" label="Polls" Icon={Megaphone} />
        <Item href="/sponsors" label="Sponsors" Icon={HandCoins} />
      </div>
    </nav>
  );
}
