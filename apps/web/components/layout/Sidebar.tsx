"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import LogoutButton from "@/components/auth/LogoutButton";
import Wordmark from "@/components/brand/Wordmark";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import type { CurrentUser } from "@/lib/auth";

import NavigationIcon from "./NavigationIcon";
import {
  canViewNavigationItem,
  isNavigationItemActive,
  navigationGroups,
  todayNavigationItem,
  type NavigationItem,
} from "./navigation-config";

type Props = { user: CurrentUser };

export default function Sidebar({ user }: Props) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountAreaRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountLinkRef = useRef<HTMLAnchorElement>(null);

  const displayName = user.athleteProfile?.displayName ?? user.email;
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canViewNavigationItem(item, user.permissions),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!accountMenuOpen) return;

    accountLinkRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
        accountButtonRef.current?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !accountAreaRef.current?.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [accountMenuOpen]);

  function navigationItem(item: NavigationItem) {
    const active = isNavigationItemActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`group flex min-h-10 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          active
            ? "border-accent/30 bg-accent/10 text-accent shadow-sm"
            : "border-transparent text-muted hover:bg-surface-elevated hover:text-foreground"
        }`}
      >
        <span className={`h-5 w-1 rounded-full transition ${active ? "bg-accent" : "bg-transparent"}`} />
        <NavigationIcon name={item.icon} className="h-5 w-5 shrink-0" />
        <span className="min-w-0 truncate">{t(item.key)}</span>
      </Link>
    );
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
      <div className="px-6 pb-4 pt-6">
        <Link href="/dashboard" aria-label={t("today")}>
          <Wordmark />
        </Link>
        <Link
          href="/workouts"
          className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 text-sm font-black text-slate-950 shadow-lg shadow-lime-400/10 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
        >
          <NavigationIcon name="add" className="h-5 w-5" />
          {t("logResult")}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label={t("desktopLabel")}>
        <div>{navigationItem(todayNavigationItem)}</div>
        <div className="mt-4 space-y-4">
          {visibleGroups.map((group) => (
            <section key={group.key} aria-labelledby={`desktop-nav-${group.key}`}>
              <h2
                id={`desktop-nav-${group.key}`}
                className="mb-1 px-4 text-[10px] font-black uppercase tracking-[0.18em] text-muted/80"
              >
                {t(`groups.${group.key}`)}
              </h2>
              <div className="space-y-0.5">{group.items.map(navigationItem)}</div>
            </section>
          ))}
        </div>
      </nav>

      <div ref={accountAreaRef} className="relative border-t border-border p-3">
        {accountMenuOpen ? (
          <div
            id="desktop-account-menu"
            aria-labelledby="desktop-account-menu-button"
            className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-2xl"
          >
            <Link
              ref={accountLinkRef}
              href="/account"
              onClick={() => setAccountMenuOpen(false)}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-muted transition hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <NavigationIcon name="account" className="h-5 w-5" />
              {t("account")}
            </Link>
            <div className="my-2 border-t border-border" />
            <LanguageSwitcher />
            <div className="my-2 border-t border-border" />
            <LogoutButton className="flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-muted transition hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50">
              {t("logout")}
            </LogoutButton>
          </div>
        ) : null}

        <button
          ref={accountButtonRef}
          id="desktop-account-menu-button"
          type="button"
          onClick={() => setAccountMenuOpen((current) => !current)}
          aria-expanded={accountMenuOpen}
          aria-controls="desktop-account-menu"
          aria-label={accountMenuOpen ? t("closeAccountMenu") : t("accountMenu")}
          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent bg-accent/10 text-xs font-black text-accent">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{displayName}</span>
            <span className="block truncate text-xs text-muted">{user.email}</span>
          </span>
          <span aria-hidden="true" className={`text-xs text-muted transition-transform ${accountMenuOpen ? "rotate-180" : ""}`}>↑</span>
        </button>
      </div>
    </aside>
  );
}
