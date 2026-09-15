"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
import {
  getLibraryScopeLabels,
  type LibraryScopeFilter,
} from "@/lib/library-scope";
import type { PaginatedResponse } from "@/lib/pagination";

import MovementCard, { Movement } from "./MovementCard";
import MovementEditor from "./MovementEditor";

type Props = {
  initialMovements: PaginatedResponse<Movement>;
  categories: { key: string; name: string }[];
  measurementTypes: { key: string; name: string }[];
};

export default function MovementLibrary({
  initialMovements,
  categories,
  measurementTypes,
}: Props) {
  const t = useTranslations("movements");
  const paginationT = useTranslations("pagination");
  const locale = useLocale();
  const scopeLabels = getLibraryScopeLabels(locale);

  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<LibraryScopeFilter>("all");
  const [pages, setPages] = useState<
    Record<string, PaginatedResponse<Movement>>
  >(() => ({ "all-": initialMovements }));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedSearch = search.trim();
  const queryKey = `${scope}-${normalizedSearch.toLowerCase()}`;
  const displayedPage = pages[queryKey];
  const displayedMovements = displayedPage?.items ?? [];

  useEffect(() => {
    if (pages[queryKey]) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(
      async () => {
        setIsLoading(true);
        setError(null);
        try {
          const query = new URLSearchParams({
            scope,
            page: "1",
            pageSize: "12",
          });
          if (normalizedSearch) query.set("search", normalizedSearch);

          const response = await fetch(`/api/movements?${query.toString()}`, {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Unable to load movements");

          const page =
            (await response.json()) as PaginatedResponse<Movement>;
          setPages((current) => ({ ...current, [queryKey]: page }));
        } catch (caughtError) {
          if (
            caughtError instanceof DOMException &&
            caughtError.name === "AbortError"
          )
            return;
          setError(t("searchError"));
        } finally {
          if (!controller.signal.aborted) setIsLoading(false);
        }
      },
      normalizedSearch ? 300 : 0,
    );

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedSearch, pages, queryKey, scope, t]);

  async function loadMore() {
    if (!displayedPage?.hasNextPage || isLoading) return;
    setIsLoading(true);
    setError(null);

    const query = new URLSearchParams({
      scope,
      page: String(displayedPage.page + 1),
      pageSize: String(displayedPage.pageSize),
    });
    if (normalizedSearch) query.set("search", normalizedSearch);

    try {
      const response = await fetch(`/api/movements?${query.toString()}`);
      if (!response.ok) throw new Error("Unable to load movements");
      const nextPage =
        (await response.json()) as PaginatedResponse<Movement>;

      setPages((current) => ({
        ...current,
        [queryKey]: {
          ...nextPage,
          items: [...displayedPage.items, ...nextPage.items],
        },
      }));
    } catch {
      setError(t("searchError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <MovementEditor
        categories={categories}
        measurementTypes={measurementTypes}
      />

      <div className="sticky top-0 z-10 -mx-4 mt-8 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            ⌕
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {(["all", "mine"] as LibraryScopeFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={scope === value}
              onClick={() => setScope(value)}
              className={[
                "min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                scope === value
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-surface text-muted hover:bg-surface-elevated hover:text-foreground",
              ].join(" ")}
            >
              {scopeLabels[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 min-h-5">
        {error ? (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        ) : displayedPage ? (
          <p className="text-sm text-muted">
            {t("movementCount", { count: displayedPage.total })}
          </p>
        ) : (
          <p className="text-sm text-muted">{t("searching")}</p>
        )}
      </div>

      {displayedMovements.length === 0 && !isLoading ? (
        <div className="mt-5 rounded-xl border border-dashed border-border px-4 py-10 text-center sm:px-6 sm:py-16">
          <p className="font-semibold">{t("emptyTitle")}</p>
          <p className="mt-2 text-sm text-muted">{t("emptyDescription")}</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {displayedMovements.map((movement) => (
              <MovementCard key={movement.id} movement={movement} />
            ))}
          </div>

          {displayedPage?.hasNextPage ? (
            <div className="mt-6 flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={isLoading}
                onClick={() => void loadMore()}
              >
                {isLoading
                  ? t("searching")
                  : paginationT("loadMore", {
                      count: Math.min(
                        displayedPage.pageSize,
                        displayedPage.total - displayedMovements.length,
                      ),
                    })}
              </Button>
              <p className="text-xs text-muted" aria-live="polite">
                {paginationT("showing", {
                  shown: displayedMovements.length,
                  total: displayedPage.total,
                })}
              </p>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
