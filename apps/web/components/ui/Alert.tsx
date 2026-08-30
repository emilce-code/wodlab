import type {
  HTMLAttributes,
  ReactNode,
} from 'react';

type AlertVariant =
  | 'error'
  | 'info'
  | 'success';

type AlertProps =
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
    variant?: AlertVariant;
  };

const variants: Record<
  AlertVariant,
  string
> = {
  error:
    'border-red-500/20 bg-red-500/5 text-red-500',
  info:
    'border-border bg-surface-elevated text-foreground',
  success:
    'border-accent/30 bg-accent/10 text-accent',
};

export default function Alert({
  children,
  variant = 'info',
  className = '',
  role,
  ...props
}: AlertProps) {
  return (
    <div
      role={
        role ??
        (variant === 'error'
          ? 'alert'
          : 'status')
      }
      className={[
        'rounded-lg border px-4 py-3 text-sm',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}