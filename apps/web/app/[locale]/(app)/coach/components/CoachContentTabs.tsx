"use client";

import { useRef, type KeyboardEvent } from "react";

type Tab<Key extends string> = {
  key: Key;
  label: string;
  count?: number;
};

type Props<Key extends string> = {
  value: Key;
  onChange: (value: Key) => void;
  tabs: readonly Tab<Key>[];
  label: string;
};

export default function CoachContentTabs<Key extends string>({
  value,
  onChange,
  tabs,
  label,
}: Props<Key>) {
  const buttonRefs = useRef(new Map<Key, HTMLButtonElement>());

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    const next = tabs[nextIndex];
    onChange(next.key);
    buttonRefs.current.get(next.key)?.focus();
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div
        role="tablist"
        aria-label={label}
        className="flex min-w-max gap-1 rounded-xl border border-border bg-surface p-1"
      >
        {tabs.map((tab, index) => {
          const active = tab.key === value;
          return (
            <button
              key={tab.key}
              ref={(element) => {
                if (element) buttonRefs.current.set(tab.key, element);
                else buttonRefs.current.delete(tab.key);
              }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={[
                "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                active
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted hover:bg-surface-elevated hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
              {tab.count !== undefined ? (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs",
                    active ? "bg-black/15" : "bg-surface-elevated",
                  ].join(" ")}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
