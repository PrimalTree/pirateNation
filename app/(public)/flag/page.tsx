"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PirateShip } from '../components/FlagVisuals';

export default function FlagPage() {
  return (
    <div className="fixed inset-0 z-40" style={{ backgroundColor: '#b91c1c' }}>
      <div className="absolute left-0 right-0 top-0 mx-auto flex max-w-6xl items-center justify-between p-4">
        <div className="text-sm text-white/80">No Quarter</div>
        <Link
          href="/"
          className="rounded-xl border border-zinc-800/60 bg-black/30 px-3 py-1.5 text-sm text-zinc-100 backdrop-blur hover:bg-black/40"
        >
          Close
        </Link>
      </div>

      <div className="flex h-full items-center justify-center p-6">
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
    </div>
  );
}

