import * as React from 'react';

export function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="region" className={["rounded-lg border border-white/10 bg-black/40", className].join(' ')} {...props} />;
}

export function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["border-b border-white/10 px-4 py-3", className].join(' ')} {...props} />;
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={["text-base font-semibold", className].join(' ')} {...props} />;
}

export function CardDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={["text-sm text-white/70", className].join(' ')} {...props} />;
}

export function CardContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["px-4 py-3", className].join(' ')} {...props} />;
}

export function CardFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["border-t border-white/10 px-4 py-3", className].join(' ')} {...props} />;
}

