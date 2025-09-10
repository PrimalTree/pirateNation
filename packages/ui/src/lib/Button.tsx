"use client";
import * as React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost';
};

export function Button({ className = '', variant = 'default', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants: Record<string, string> = {
    default: 'bg-pirate-gold text-black hover:opacity-90 focus:ring-pirate-gold',
    ghost: 'bg-transparent text-white hover:bg-white/10 focus:ring-white'
  };
  return (
    <button className={[base, variants[variant], className].join(' ')} {...props} />
  );
}
