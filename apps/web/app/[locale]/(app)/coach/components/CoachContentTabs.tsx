"use client";

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
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div
        role="tablist"
        aria-label={label}
        className="flex min-w-max gap-1 rounded-xl border border-border bg-surface p-1"
      >
        {tabs.map((tab) => {
          const active = tab.key === value;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.key)}
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
