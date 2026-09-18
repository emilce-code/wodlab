"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

const guideKeys = [
  "gettingStarted",
  "workouts",
  "results",
  "progress",
  "training",
  "coaching",
] as const;

const conceptKeys = ["workout", "variation", "section", "movement"] as const;

export default function HelpGuide() {
  const t = useTranslations("help");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const visibleGuides = useMemo(
    () =>
      guideKeys.filter((key) => {
        if (!normalizedQuery) return true;

        return [
          t(`guides.${key}.title`),
          t(`guides.${key}.summary`),
          t(`guides.${key}.body`),
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      }),
    [normalizedQuery, t],
  );

  return (
    <div className="mt-6 space-y-6 sm:mt-8">
      <div>
        <label htmlFor="help-search" className="sr-only">
          {t("searchLabel")}
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          >
            ⌕
          </span>
          <input
            id="help-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="min-h-12 w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>
      </div>

      <section aria-labelledby="guide-list-title">
        <h2 id="guide-list-title" className="text-lg font-bold">
          {t("guidesTitle")}
        </h2>
        <div className="mt-3 space-y-3">
          {visibleGuides.map((key) => (
            <details
              key={key}
              className="group rounded-xl border border-border bg-surface"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 marker:content-none">
                <span>
                  <span className="block text-sm font-semibold">
                    {t(`guides.${key}.title`)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {t(`guides.${key}.summary`)}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl text-muted transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="border-t border-border px-4 py-4 text-sm leading-6 text-muted">
                {t(`guides.${key}.body`)}
              </div>
            </details>
          ))}
          {visibleGuides.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
              {t("empty")}
            </div>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="concepts-title"
        className="rounded-2xl border border-accent/25 bg-accent/5 p-4 sm:p-6"
      >
        <h2 id="concepts-title" className="text-lg font-bold">
          {t("concepts.title")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("concepts.description")}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {conceptKeys.map((key) => (
            <div key={key} className="rounded-xl bg-background p-4">
              <dt className="text-sm font-semibold">
                {t(`concepts.${key}.term`)}
              </dt>
              <dd className="mt-1 text-xs leading-5 text-muted">
                {t(`concepts.${key}.definition`)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
