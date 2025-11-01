"use client";
import { motion } from "framer-motion";

export function PirateShip({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <g fill="currentColor">
        <path d="M6 49c3 4 10 7 26 7s23-3 26-7H6z" opacity="0.9" />
        <path d="M12 44h40c-1.5 5-8 9-20 9s-18.5-4-20-9z" />
        <rect x="31" y="11" width="2" height="28" rx="1" />
        <path d="M18 28h15c-5-5-7-9-7-12-3 2-6 6-8 12z" />
        <path d="M34 22h12c-4-3-7-6-9-9-1 3-2 6-3 9z" />
        <rect x="16" y="40" width="32" height="3" rx="1.5" />
        <circle cx="24" cy="51" r="2" />
        <circle cx="32" cy="53" r="2" />
        <circle cx="40" cy="51" r="2" />
        <path d="M33 11l8 2-8 2z" />
      </g>
    </svg>
  );
}

export function FlagCard({ className = '' }: { className?: string }) {
  return (
    <div className={["relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900", className].join(' ')}>
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundPositionX: [0, 30, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        style={{
          backgroundImage:
            "radial-gradient(1000px 300px at 0% 50%, rgba(168,85,247,0.15), transparent)",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative h-40 w-64 overflow-hidden rounded-md bg-red-700 shadow-2xl ring-1 ring-red-900"
          animate={{ rotateZ: [0, 1.5, 0, -1.5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <PirateShip className="h-20 w-20 text-zinc-200" />
          </div>
          <div className="absolute bottom-2 right-2 text-[10px] uppercase tracking-widest text-zinc-200">
            No Quarter
          </div>
        </motion.div>
      </div>
    </div>
  );
}

