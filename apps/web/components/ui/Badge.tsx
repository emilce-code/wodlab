import type { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'default' | 'accent';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default:
    'border-border bg-surface-elevated text-muted',

  accent:
    'border-accent/40 bg-accent/10 text-accent',
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-md border px-2 py-1',
        'text-[11px] font-semibold uppercase tracking-wide',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}