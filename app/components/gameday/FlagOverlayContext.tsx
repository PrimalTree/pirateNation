"use client";
import React from 'react';

type Ctx = { open: () => void; close: () => void; isOpen: boolean };
const FlagOverlayCtx = React.createContext<Ctx | null>(null);

export function FlagOverlayProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const value = React.useMemo<Ctx>(() => ({ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }), [isOpen]);
  return <FlagOverlayCtx.Provider value={value}>{children}</FlagOverlayCtx.Provider>;
}

export function useFlagOverlay() {
  const v = React.useContext(FlagOverlayCtx);
  if (!v) throw new Error('useFlagOverlay must be used within FlagOverlayProvider');
  return v;
}

