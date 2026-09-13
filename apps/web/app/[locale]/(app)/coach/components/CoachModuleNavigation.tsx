"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

const items = [
  { key: "overview", href: "/coach" },
  { key: "programming", href: "/coach/programming" },
  { key: "monitoring", href: "/coach/monitoring" },
  { key: "analytics", href: "/coach/analytics" },
] as const;

const athleteDetailPath = /^\/coach\/[^/]+$/;
const coachModulePaths = new Set<string>(items.map((item) => item.href));

function isOverviewActive(pathname: string) {
  if (pathname === "/coach") return true;

  return athleteDetailPath.test(pathname) && !coachModulePaths.has(pathname);
}

export default function CoachModuleNavigation() {
  const t = useTranslations("coachNavigation");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div className="flex min-w-max gap-1 rounded-xl border border-border bg-surface p-1">
        {items.map((item) => {
          const active =
            item.href === "/coach"
              ? isOverviewActive(pathname)
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted hover:bg-surface-elevated hover:text-foreground",
              ].join(" ")}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
