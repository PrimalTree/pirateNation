import * as React from 'react';

export type AvatarProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  name?: string;
  size?: number;
};

export function Avatar({ name, size = 40, className = '', ...props }: AvatarProps) {
  const initials = (name ?? '').split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <div className={["inline-flex items-center justify-center overflow-hidden rounded-full bg-white/10", className].join(' ')} style={{ width: size, height: size }}>
      {props.src ? (
        <img alt={props.alt ?? name ?? 'avatar'} {...props} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs text-white/80">{initials || '•'}</span>
      )}
    </div>
  );
}

