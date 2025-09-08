"use client";
import * as React from 'react';

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children?: React.ReactNode;
};

export function Modal({ open, onOpenChange, title, children }: ModalProps) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onOpenChange(false); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title ?? 'Dialog'}>
      <div className="absolute inset-0 bg-black/60" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-white/10 bg-black p-4 shadow-xl">
        {title && <h2 className="mb-2 text-lg font-semibold">{title}</h2>}
        {children}
        <div className="mt-3 flex justify-end">
          <button className="rounded border border-white/10 px-3 py-1 text-sm" onClick={() => onOpenChange(false)}>Close</button>
        </div>
      </div>
    </div>
  );
}

