import * as React from 'react';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
};

const variants: Record<string, string> = {
  default: 'bg-white/10 text-white',
  success: 'bg-green-600/70 text-white',
  warning: 'bg-yellow-500/80 text-black',
  danger: 'bg-red-600/80 text-white',
  info: 'bg-blue-600/80 text-white'
};

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  return <span className={["inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", variants[variant], className].join(' ')} {...props} />;
}

