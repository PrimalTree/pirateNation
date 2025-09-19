"use client";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PirateShip } from '../../../components/gameday/FlagVisuals';

export default function FlagPage() {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#b91c1c' }}>
      <button
        onClick={() => router.back()}
        className="absolute right-4 top-4 rounded-xl border border-zinc-800/60 bg-black/30 px-3 py-1.5 text-sm text-zinc-100 backdrop-blur hover:bg-black/40"
      >
        Close
      </button>
      <Link href="/" className="sr-only">Home</Link>
      <div className="relative">
        <motion.div
          className="absolute -inset-6 rounded-2xl border-4"
          animate={{ borderColor: ['transparent', '#FDC82F', '#592A8A', 'transparent'] }}
          transition={{ duration: 1.0, times: [0, 0.35, 0.7, 1], repeat: Infinity }}
        />
        <motion.div
          className="relative"
          initial={{ color: '#ffffff' }}
          animate={{ color: ['#ffffff', '#FDC82F', '#592A8A', '#ffffff'] }}
          transition={{ duration: 1.0, times: [0, 0.35, 0.7, 1], repeat: Infinity }}
          style={{ willChange: 'color' }}
        >
          <PirateShip className="mx-auto h-64 w-64 drop-shadow-[0_4px_14px_rgba(0,0,0,0.4)]" />
        </motion.div>
      </div>
    </div>
  );
}

