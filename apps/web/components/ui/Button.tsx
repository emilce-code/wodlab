import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger';

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: ButtonVariant;
  };

const variants: Record<
  ButtonVariant,
  string
> = {
  primary:
    'bg-accent text-accent-foreground hover:bg-accent-strong',

  secondary:
    'border border-border bg-surface text-foreground hover:bg-surface-elevated',

  ghost:
    'text-muted hover:bg-surface-elevated hover:text-foreground',

  danger:
    'border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/15',
};

export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-lg px-4 py-2.5',
        'text-sm font-semibold',
        'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}