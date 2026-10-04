"use client";

import { useId, useState } from "react";
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
  const [isSavingLocale, setIsSavingLocale] = useState(false);

  async function handleChange(nextLocale: string) {
    if (
      !routing.locales.includes(nextLocale as (typeof routing.locales)[number])
    ) {
      return;
    }

    setIsSavingLocale(true);

    try {
      await fetch("/api/me/preferred-locale", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          preferredLocale: nextLocale,
        }),
      });
    } finally {
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

      setIsSavingLocale(false);
    }
  }

  return (
    <div>
      <label htmlFor={selectId} className="sr-only">
        {t("language")}
      </label>

      <select
        id={selectId}
        value={locale}
        disabled={isSavingLocale}
        onChange={(event) => void handleChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition hover:border-accent/40 focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
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
