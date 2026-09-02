"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import LogoutButton from "@/components/auth/LogoutButton";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { Link, usePathname } from "@/i18n/navigation";

import NavigationIcon, { type NavigationIconName } from "./NavigationIcon";

const navigation = [
  { key: "today", href: "/dashboard", icon: "today" },
  { key: "workouts", href: "/workouts", icon: "workouts" },
  { key: "history", href: "/history", icon: "history" },
  { key: "progress", href: "/progress", icon: "progress" },
] as const satisfies readonly {
  key: string;
  href: string;
  icon: NavigationIconName;
}[];

export default function MobileNavigation() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);

  const moreSectionActive =
    pathname.startsWith("/movements") || pathname.startsWith("/account");

  useEffect(() => {
    if (!moreMenuOpen) {
      return;
    }

    firstMenuLinkRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreMenuOpen(false);
        moreButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moreMenuOpen]);

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  function closeMoreMenu(restoreFocus = false) {
    setMoreMenuOpen(false);

    if (restoreFocus) {
      moreButtonRef.current?.focus();
    }
  }

  return (
    <>
      {moreMenuOpen && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => closeMoreMenu(true)}
          />

          <section
            id="mobile-more-menu"
            aria-labelledby="mobile-more-menu-title"
            className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-border bg-surface p-4 shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="mobile-more-menu-title" className="font-bold">
                {t("menuTitle")}
              </h2>

              <button
                type="button"
                onClick={() => closeMoreMenu(true)}
                aria-label={t("closeMenu")}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted transition hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <NavigationIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 grid gap-2">
              <Link
                ref={firstMenuLinkRef}
                href="/movements"
                onClick={() => closeMoreMenu()}
                aria-current={
                  pathname.startsWith("/movements") ? "page" : undefined
                }
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <NavigationIcon name="movements" className="h-5 w-5" />
                {t("movements")}
              </Link>

              <Link
                href="/account"
                onClick={() => closeMoreMenu()}
                aria-current={
                  pathname.startsWith("/account") ? "page" : undefined
                }
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <NavigationIcon name="account" className="h-5 w-5" />
                {t("account")}
              </Link>
            </div>

            <div className="my-4 border-t border-border" />

            <div className="grid gap-3">
              <LanguageSwitcher />

              <LogoutButton className="flex min-h-11 w-full items-center justify-center rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50">
                {t("logout")}
              </LogoutButton>
            </div>
          </section>
        </>
      )}

      <nav
        aria-label={t("mobileLabel")}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-5">
          {navigation.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => closeMoreMenu()}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1",
                  "text-[10px] font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
                  active ? "text-accent" : "text-muted",
                ].join(" ")}
              >
                <NavigationIcon name={item.icon} className="h-5 w-5" />
                <span className="max-w-full truncate">{t(item.key)}</span>
              </Link>
            );
          })}

          <button
            ref={moreButtonRef}
            type="button"
            onClick={() => setMoreMenuOpen((current) => !current)}
            aria-expanded={moreMenuOpen}
            aria-controls="mobile-more-menu"
            className={[
              "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1",
              "text-[10px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
              moreMenuOpen || moreSectionActive ? "text-accent" : "text-muted",
            ].join(" ")}
          >
            <NavigationIcon name="more" className="h-5 w-5" />
            <span className="max-w-full truncate">{t("more")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
