"use client";
import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      const register = async () => {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('SW registration failed', e);
        }
      };
      // Delay until page is interactive to avoid blocking hydration
      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register, { once: true });
    }
  }, []);
  return null;
}

