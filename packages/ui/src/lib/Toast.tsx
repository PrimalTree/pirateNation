"use client";
import * as React from 'react';

type ToastItem = { id: number; message: string };

const ToastContext = React.createContext<{ add: (message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const add = (message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };
  return (
    <ToastContext.Provider value={{ add }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className="pointer-events-auto rounded-md border border-white/10 bg-black/90 px-3 py-2 text-sm text-white shadow">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

