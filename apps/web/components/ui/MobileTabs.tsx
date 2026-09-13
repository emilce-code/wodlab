"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type MobileTab = {
  id: string;
  label: string;
  badge?: number;
};

type MobileTabsContextValue = {
  activeTab: string;
};

const MobileTabsContext = createContext<MobileTabsContextValue | null>(null);

type MobileTabsProps = {
  tabs: MobileTab[];
  defaultTab: string;
  children: ReactNode;
  queryParam?: string;
  ariaLabel: string;
  className?: string;
};

export default function MobileTabs({
  tabs,
  defaultTab,
  children,
  queryParam = "tab",
  ariaLabel,
  className = "",
}: MobileTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabIds = useMemo(() => new Set(tabs.map((tab) => tab.id)), [tabs]);
  const requestedTab = searchParams.get(queryParam);
  const activeTab =
    requestedTab && tabIds.has(requestedTab) ? requestedTab : defaultTab;
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeTab]);

  function selectTab(tabId: string) {
    if (tabId === activeTab) return;

    const nextParams = new URLSearchParams(searchParams.toString());

    if (tabId === defaultTab) {
      nextParams.delete(queryParam);
    } else {
      nextParams.set(queryParam, tabId);
    }

    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    tabIndex: number,
  ) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    let nextIndex = tabIndex;

    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (event.key === "ArrowLeft") {
      nextIndex = (tabIndex - 1 + tabs.length) % tabs.length;
    }
    if (event.key === "ArrowRight") {
      nextIndex = (tabIndex + 1) % tabs.length;
    }

    const nextTab = tabs[nextIndex];
    selectTab(nextTab.id);
    buttonRefs.current.get(nextTab.id)?.focus();
  }

  return (
    <MobileTabsContext.Provider value={{ activeTab }}>
      <div
        className={[
          "sticky top-0 z-30 -mx-4 mt-6 border-y border-border bg-background/95 px-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border",
          className,
        ].join(" ")}
      >
        <div
          role="tablist"
          aria-label={ariaLabel}
          className="flex snap-x snap-mandatory gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab, tabIndex) => {
            const selected = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                ref={(element) => {
                  if (element) {
                    buttonRefs.current.set(tab.id, element);
                  } else {
                    buttonRefs.current.delete(tab.id);
                  }

                  if (selected) activeButtonRef.current = element;
                }}
                type="button"
                role="tab"
                id={`${queryParam}-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`${queryParam}-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                onKeyDown={(event) => handleKeyDown(event, tabIndex)}
                className={[
                  "inline-flex min-h-11 shrink-0 snap-center items-center gap-2 rounded-lg px-4 text-sm font-semibold transition",
                  selected
                    ? "bg-accent text-accent-foreground"
                    : "text-muted hover:bg-surface-elevated hover:text-foreground",
                ].join(" ")}
              >
                {tab.label}
                {tab.badge !== undefined ? (
                  <span
                    className={[
                      "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs",
                      selected
                        ? "bg-background/20"
                        : "bg-surface-elevated text-foreground",
                    ].join(" ")}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {children}
    </MobileTabsContext.Provider>
  );
}

type MobileTabPanelProps = {
  tabId: string;
  children: ReactNode;
  className?: string;
  queryParam?: string;
};

export function MobileTabPanel({
  tabId,
  children,
  className = "",
  queryParam = "tab",
}: MobileTabPanelProps) {
  const context = useContext(MobileTabsContext);

  if (!context) {
    throw new Error("MobileTabPanel must be used inside MobileTabs.");
  }

  const selected = context.activeTab === tabId;

  return (
    <div
      role="tabpanel"
      id={`${queryParam}-panel-${tabId}`}
      aria-labelledby={`${queryParam}-tab-${tabId}`}
      hidden={!selected}
      tabIndex={0}
      className={["outline-none", className].join(" ")}
    >
      {children}
    </div>
  );
}
