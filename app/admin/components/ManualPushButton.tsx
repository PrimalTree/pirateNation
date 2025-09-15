"use client";
import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerLive } from '../actions';

export function ManualPushButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [variant, setVariant] = useState<'success' | 'error'>('success');

  const onClick = () => {
    setMsg(null);
    start(async () => {
      const res = await triggerLive();
      if (res.ok) {
        setVariant('success');
        setMsg('Live update pushed');
      } else {
        setVariant('error');
        setMsg(res.error || 'Failed to push');
      }
      setTimeout(() => setMsg(null), 2500);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-md bg-ecu-gold px-3 py-1.5 text-black hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Pushing…' : 'Push Live Update'}
      </button>
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className={[
              'rounded-lg border px-3 py-2 text-sm shadow-lg backdrop-blur',
              variant === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
                : 'border-red-500/30 bg-red-500/15 text-red-200'
            ].join(' ')}>
              {msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
