"use client";
import Link from 'next/link';
import { HandHeart, MessageSquare, Ticket } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function BottomNav() {  
  const pathname = usePathname();
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
    const active = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={[
          'flex flex-1 flex-col items-center justify-center gap-1 py-2',
          active ? 'text-ecu-gold' : 'text-zinc-400 hover:text-zinc-200'
        ].join(' ')}
      >
        <Icon className="h-5 w-5" />
        <span className="text-xs">{label}</span>
      </Link>
    );
  };

  return (
    <nav ref={navRef} className="fixed inset-x-0 bottom-0 z-30 border-t border-ecu-purple/40 bg-black/80 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-3 px-2">
        <Item href="/gameday" label="Gameday" Icon={Ticket} />
        <Item href="/engage" label="Engage" Icon={MessageSquare} />
        <Item href="/donate" label="Support" Icon={HandHeart} />
      </div>
    </nav>
  );
}
