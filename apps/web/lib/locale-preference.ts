import { routing } from "@/i18n/routing";

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(value: string): value is AppLocale {
  return routing.locales.includes(value as AppLocale);
}

export function pathWithLocale(pathname: string, locale: AppLocale) {
  const segments = pathname.split("/");
  const currentLocale = segments[1];

  if (currentLocale && isAppLocale(currentLocale)) {
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  }

  return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
