import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
};

// Render one interactive control per row; keep nested actions in a static list.
export default function ListItem({
  children,
  leading,
  trailing,
  selected = false,
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none ${selected ? "border-accent/50 bg-accent/5" : "border-border bg-surface"} ${className}`}
      {...props}
    >
      {leading ? (
        <span aria-hidden="true" className="shrink-0">
          {leading}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 break-words">{children}</span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </button>
  );
}
