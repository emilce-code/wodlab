import type { HTMLAttributes, ReactNode } from "react";

// The shared shell owns navigation. This component reserves scrolling space and
// clears its floating log control as well as the bottom safe area.
export default function StickyActions({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <>
      <div aria-hidden="true" className="h-28 lg:hidden" />
      <div
        {...props}
        data-sticky-actions
        className={`fixed inset-x-0 bottom-[calc(var(--mobile-nav-height,4rem)+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background px-4 pt-3 pb-6 lg:static lg:border-0 lg:px-0 lg:py-0 ${className}`}
      >
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
