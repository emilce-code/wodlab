"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
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
  const [search, setSearch] = useState("");
  const [defaultPage, setDefaultPage] = useState(initialMovements);
  const [searchResult, setSearchResult] = useState<{
    query: string;
    page: PaginatedResponse<Movement>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedSearch = search.trim();
  const hasSearch = normalizedSearch.length > 0;
  const searchPage =
    searchResult?.query === normalizedSearch ? searchResult.page : null;
  const displayedPage = hasSearch ? searchPage : defaultPage;
  const displayedMovements = displayedPage?.items ?? [];

  useEffect(() => {
    if (!normalizedSearch) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({
          search: normalizedSearch,
          page: "1",
          pageSize: "12",
        });
        const response = await fetch(`/api/movements?${query.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unable to search movements");
        setSearchResult({
          query: normalizedSearch,
          page: (await response.json()) as PaginatedResponse<Movement>,
        });
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
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedSearch, t]);

  async function loadMore() {
    if (!displayedPage?.hasNextPage || isLoading) return;
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams({
      page: String(displayedPage.page + 1),
      pageSize: String(displayedPage.pageSize),
    });
    if (hasSearch) query.set("search", normalizedSearch);
    try {
      const response = await fetch(`/api/movements?${query.toString()}`);
      if (!response.ok) throw new Error("Unable to load movements");
      const nextPage = (await response.json()) as PaginatedResponse<Movement>;
      const mergedPage = {
        ...nextPage,
        items: [...displayedPage.items, ...nextPage.items],
      };
      if (hasSearch) {
        setSearchResult({ query: normalizedSearch, page: mergedPage });
      } else {
        setDefaultPage(mergedPage);
      }
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
      <div className="mt-8">
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
        <div className="mt-3 flex min-h-5 items-center">
          {isLoading && hasSearch && !searchPage ? (
            <p className="text-sm text-muted">{t("searching")}</p>
          ) : error ? (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          ) : (
            <p className="text-sm text-muted">
              {t("movementCount", { count: displayedPage?.total ?? 0 })}
            </p>
          )}
        </div>
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
