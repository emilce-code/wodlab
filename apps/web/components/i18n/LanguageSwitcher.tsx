"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const localeLabels = {
  en: "English",
  es: "Español",
  pt: "Português",
} as const;

export default function LanguageSwitcher() {
  const t = useTranslations("common");
  const selectId = useId();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();

  function handleChange(nextLocale: string) {
    if (
      !routing.locales.includes(nextLocale as (typeof routing.locales)[number])
    ) {
      return;
    }

    router.replace(
      // next-intl requires params when
      // changing locale on dynamic routes.
      {
        pathname,
        params,
      } as never,
      {
        locale: nextLocale,
      },
    );
  }

  return (
    <div>
      <label htmlFor={selectId} className="sr-only">
        {t("language")}
      </label>

      <select
        id={selectId}
        value={locale}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition hover:border-accent/40 focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
      >
        {routing.locales.map((availableLocale) => (
          <option key={availableLocale} value={availableLocale}>
            {localeLabels[availableLocale]}
          </option>
        ))}
      </select>
    </div>
  );
}
