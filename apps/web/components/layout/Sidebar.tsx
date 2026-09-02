"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import LogoutButton from "@/components/auth/LogoutButton";
import Wordmark from "@/components/brand/Wordmark";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import NavigationIcon, { type NavigationIconName } from "./NavigationIcon";

const navigation = [
  {
    key: "today",
    href: "/dashboard",
    icon: "today",
  },
  {
    key: "workouts",
    href: "/workouts",
    icon: "workouts",
  },
  {
    key: "history",
    href: "/history",
    icon: "history",
  },
  {
    key: "progress",
    href: "/progress",
    icon: "progress",
  },
] as const;

const secondaryNavigation = [
  {
    key: "movements",
    href: "/movements",
    icon: "movements",
  },
] as const satisfies readonly {
  key: string;
  href: string;
  icon: NavigationIconName;
}[];

type Props = {
  user: {
    email: string;

    athleteProfile?: {
      displayName?: string | null;
    } | null;
  };
};

export default function Sidebar({ user }: Props) {
  const t = useTranslations("navigation");

  const pathname = usePathname();

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const displayName = user.athleteProfile?.displayName ?? user.email;

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  function renderNavigationItem(
    item: (typeof navigation)[number] | (typeof secondaryNavigation)[number],
  ) {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={[
          "flex items-center gap-3 rounded-lg px-3 py-2.5",
          "text-sm font-medium transition-colors",

          active
            ? "bg-accent/10 text-accent"
            : "text-muted hover:bg-surface-elevated hover:text-foreground",
        ].join(" ")}
      >
        <NavigationIcon name={item.icon} className="h-5 w-5 shrink-0" />

        {t(item.key)}
      </Link>
    );
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
      <div className="px-6 py-7">
        <Link href="/dashboard">
          <Wordmark />
        </Link>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-1">{navigation.map(renderNavigationItem)}</div>

        <div className="my-5 border-t border-border" />

        <div className="space-y-1">
          {secondaryNavigation.map(renderNavigationItem)}
        </div>
      </nav>

      <div className="px-4 pb-3">
        <LanguageSwitcher />
      </div>

      <div className="relative border-t border-border p-4">
        {accountMenuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-xl">
            <Link
              href="/account"
              onClick={() => setAccountMenuOpen(false)}
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted transition hover:bg-surface-elevated hover:text-foreground"
            >
              {t("account")}
            </Link>

            <div className="my-1 border-t border-border" />

            <LogoutButton className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted transition hover:bg-surface-elevated hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50">
              {t("logout")}
            </LogoutButton>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAccountMenuOpen((current) => !current)}
          aria-expanded={accountMenuOpen}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-surface-elevated"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent text-xs font-bold text-accent">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>

            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>

          <span
            aria-hidden="true"
            className={[
              "text-xs text-muted transition-transform",

              accountMenuOpen ? "rotate-180" : "",
            ].join(" ")}
          >
            ↑
          </span>
        </button>
      </div>
    </aside>
  );
}
