"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { CurrentUser } from "@/lib/auth";
import { isAppLocale, pathWithLocale } from "@/lib/locale-preference";

type Props = {
  user: CurrentUser;
};

export default function LocalePreferenceRedirect({ user }: Props) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isAppLocale(user.preferredLocale) || user.preferredLocale === locale) {
      return;
    }

    const query = searchParams.toString();
    const nextPath = pathWithLocale(pathname, user.preferredLocale);

    router.replace(query ? `${nextPath}?${query}` : nextPath);
  }, [locale, pathname, router, searchParams, user.preferredLocale]);

  return null;
}
