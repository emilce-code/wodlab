import type { NavigationIconName } from "./NavigationIcon";

export type NavigationItem = {
  key: string;
  href: string;
  icon: NavigationIconName;
  permission?: "coach:use" | "users:manage" | "box:manage";
};

export type NavigationGroup = {
  key: "train" | "track" | "manage" | "wodly";
  items: readonly NavigationItem[];
};

export const todayNavigationItem = {
  key: "today",
  href: "/dashboard",
  icon: "today",
} as const satisfies NavigationItem;

export const mobilePrimaryNavigation = [
  todayNavigationItem,
  { key: "training", href: "/training", icon: "training" },
  { key: "progress", href: "/progress", icon: "progress" },
] as const satisfies readonly NavigationItem[];

export const navigationGroups = [
  {
    key: "train",
    items: [
      { key: "workouts", href: "/workouts", icon: "workouts" },
      { key: "training", href: "/training", icon: "training" },
      { key: "boxes", href: "/classes", icon: "boxes" },
    ],
  },
  {
    key: "track",
    items: [
      { key: "history", href: "/history", icon: "history" },
      { key: "progress", href: "/progress", icon: "progress" },
      { key: "movements", href: "/movements", icon: "movements" },
      { key: "calculators", href: "/calculators", icon: "calculator" },
    ],
  },
  {
    key: "manage",
    items: [
      {
        key: "coach",
        href: "/coach",
        icon: "coach",
        permission: "coach:use",
      },
      {
        key: "boxAdmin",
        href: "/box-admin",
        icon: "boxes",
        permission: "box:manage",
      },
      {
        key: "admin",
        href: "/admin/users",
        icon: "admin",
        permission: "users:manage",
      },
    ],
  },
  {
    key: "wodly",
    items: [
      {
        key: "notifications",
        href: "/notifications",
        icon: "notifications",
      },
      { key: "help", href: "/help", icon: "help" },
    ],
  },
] as const satisfies readonly NavigationGroup[];

export function canViewNavigationItem(
  item: NavigationItem,
  permissions: readonly string[],
) {
  return !item.permission || permissions.includes(item.permission);
}

export function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}
