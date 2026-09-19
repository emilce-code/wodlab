"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import LogoutButton from "@/components/auth/LogoutButton";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import type { CurrentUser } from "@/lib/auth";

import NavigationIcon from "./NavigationIcon";
import {
  canViewNavigationItem,
  isNavigationItemActive,
  mobilePrimaryNavigation,
  navigationGroups,
  type NavigationItem,
} from "./navigation-config";

type Props = { user: CurrentUser };
type OpenSheet = "more" | "log" | null;

const logActions = [
  { key: "workoutResult", href: "/workouts", icon: "workouts" },
  { key: "movementResult", href: "/movements", icon: "movements" },
  { key: "createWorkout", href: "/workouts/new", icon: "add" },
] as const;
const mobilePrimaryHrefs = new Set<string>(
  mobilePrimaryNavigation.map((item) => item.href),
);

export default function MobileNavigation({ user }: Props) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const logButtonRef = useRef<HTMLButtonElement>(null);
  const closeSheetButtonRef = useRef<HTMLButtonElement>(null);

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canViewNavigationItem(item, user.permissions) &&
        !mobilePrimaryHrefs.has(item.href),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const moreSectionActive = visibleGroups.some((group) =>
    group.items.some((item) => isNavigationItemActive(pathname, item.href)),
  ) || pathname.startsWith("/account");

  useEffect(() => {
    if (!openSheet) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeSheetButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const trigger = openSheet === "more" ? moreButtonRef : logButtonRef;
      setOpenSheet(null);
      trigger.current?.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openSheet]);

  function closeSheet(restoreFocus = false) {
    const trigger = openSheet === "more" ? moreButtonRef : logButtonRef;
    setOpenSheet(null);
    if (restoreFocus) trigger.current?.focus();
  }

  function toggleSheet(sheet: Exclude<OpenSheet, null>) {
    setOpenSheet((current) => (current === sheet ? null : sheet));
  }

  function navigationLink(item: NavigationItem) {
    const active = isNavigationItemActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => closeSheet()}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          active
            ? "border-accent/35 bg-accent/10 text-accent"
            : "border-transparent text-foreground hover:bg-surface-elevated"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-accent text-accent-foreground" : "bg-surface-elevated text-muted"}`}
        >
          <NavigationIcon name={item.icon} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">{t(item.key)}</span>
        <span aria-hidden="true" className="text-lg text-muted">›</span>
      </Link>
    );
  }

  return (
    <>
      {openSheet ? (
        <>
          <button
            type="button"
            aria-label={t("closeMenu")}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
            onClick={() => closeSheet(true)}
          />
          <section
            id={`mobile-${openSheet}-menu`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`mobile-${openSheet}-menu-title`}
            className="fixed inset-x-2 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 max-h-[calc(100dvh-5.5rem-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain rounded-3xl border border-border bg-surface p-4 shadow-2xl sm:inset-x-3 lg:hidden"
          >
            <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 id={`mobile-${openSheet}-menu-title`} className="text-lg font-black">
                  {t(openSheet === "more" ? "menuTitle" : "logMenuTitle")}
                </h2>
                {openSheet === "log" ? (
                  <p className="mt-1 text-sm text-muted">{t("logMenuDescription")}</p>
                ) : null}
              </div>
              <button
                ref={closeSheetButtonRef}
                type="button"
                onClick={() => closeSheet(true)}
                aria-label={t("closeMenu")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <NavigationIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            {openSheet === "log" ? (
              <div className="mt-4 grid gap-2">
                {logActions.map((action) => (
                  <Link
                    key={action.key}
                    href={action.href}
                    onClick={() => closeSheet()}
                    className="group flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-background/40 p-3 transition hover:border-lime-400/40 hover:bg-lime-400/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-400/10 text-lime-300 transition group-hover:bg-lime-400 group-hover:text-slate-950">
                      <NavigationIcon name={action.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-black">{t(`logActions.${action.key}.title`)}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted">{t(`logActions.${action.key}.description`)}</span>
                    </span>
                    <span aria-hidden="true" className="text-xl text-lime-300">›</span>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <div className="mt-2 space-y-4">
                  {visibleGroups.map((group) => (
                    <section key={group.key} aria-labelledby={`mobile-menu-${group.key}`}>
                      <h3
                        id={`mobile-menu-${group.key}`}
                        className="px-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted"
                      >
                        {t(`groups.${group.key}`)}
                      </h3>
                      <div className="mt-1 grid gap-1">
                        {group.items.map(navigationLink)}
                      </div>
                    </section>
                  ))}
                  <section aria-labelledby="mobile-menu-account">
                    <h3
                      id="mobile-menu-account"
                      className="px-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted"
                    >
                      {t("groups.account")}
                    </h3>
                    <div className="mt-1">
                      {navigationLink({ key: "account", href: "/account", icon: "account" })}
                    </div>
                  </section>
                </div>
                <div className="my-4 border-t border-border" />
                <div className="grid gap-3">
                  <LanguageSwitcher />
                  <LogoutButton className="flex min-h-11 w-full items-center justify-center rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50">
                    {t("logout")}
                  </LogoutButton>
                </div>
              </>
            )}
          </section>
        </>
      ) : null}

      <nav
        aria-label={t("mobileLabel")}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="grid grid-cols-5">
          {mobilePrimaryNavigation.slice(0, 2).map((item) => (
            <BottomNavigationLink key={item.href} item={item} pathname={pathname} label={t(item.key)} onNavigate={() => closeSheet()} />
          ))}
          <button
            ref={logButtonRef}
            type="button"
            onClick={() => toggleSheet("log")}
            aria-expanded={openSheet === "log"}
            aria-controls="mobile-log-menu"
            className="group flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-black text-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-400"
          >
            <span className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-lime-400 text-slate-950 shadow-lg shadow-lime-400/20 transition group-active:scale-95">
              <NavigationIcon name="add" className="h-6 w-6" />
            </span>
            <span>{t("log")}</span>
          </button>
          <BottomNavigationLink
            item={mobilePrimaryNavigation[2]}
            pathname={pathname}
            label={t(mobilePrimaryNavigation[2].key)}
            onNavigate={() => closeSheet()}
          />
          <button
            ref={moreButtonRef}
            type="button"
            onClick={() => toggleSheet("more")}
            aria-expanded={openSheet === "more"}
            aria-controls="mobile-more-menu"
            className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
              openSheet === "more" || moreSectionActive ? "text-accent" : "text-muted"
            }`}
          >
            <NavigationIcon name="more" className="h-5 w-5" />
            <span className="max-w-full truncate">{t("more")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function BottomNavigationLink({ item, pathname, label, onNavigate }: { item: NavigationItem; pathname: string; label: string; onNavigate: () => void }) {
  const active = isNavigationItemActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${active ? "text-accent" : "text-muted"}`}
    >
      <NavigationIcon name={item.icon} className="h-5 w-5" />
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}
