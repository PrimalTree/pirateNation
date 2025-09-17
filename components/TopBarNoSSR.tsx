"use client";
import React from 'react';
import { useEffect, useState } from 'react';
import { TopBar } from './TopBar';

export function TopBarNoSSR() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <TopBar />;
}
