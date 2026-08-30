'use client';

import {
  useEffect,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';

import MovementCard, {
  Movement,
} from './MovementCard';

type Props = {
  initialMovements: Movement[];
};

export default function MovementLibrary({
  initialMovements,
}: Props) {
  const t =
    useTranslations(
      'movements',
    );

  const [search, setSearch] =
    useState('');

  const [
    searchResults,
    setSearchResults,
  ] =
    useState<Movement[]>(
      [],
    );

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const normalizedSearch =
    search.trim();

  const hasSearch =
    normalizedSearch.length >
    0;

  const displayedMovements =
    hasSearch
      ? searchResults
      : initialMovements;

  const displayedIsSearching =
    hasSearch &&
    isSearching;

  const displayedError =
    hasSearch
      ? error
      : null;

  useEffect(() => {
    if (!normalizedSearch) {
      return;
    }

    const controller =
      new AbortController();

    const timeout =
      window.setTimeout(
        async () => {
          setIsSearching(true);
          setError(null);

          try {
            const response =
              await fetch(
                `/api/movements?search=${encodeURIComponent(
                  normalizedSearch,
                )}`,
                {
                  signal:
                    controller.signal,
                },
              );

            if (
              !response.ok
            ) {
              throw new Error(
                'Unable to search movements',
              );
            }

            const data =
              (await response.json()) as Movement[];

            setSearchResults(
              data,
            );
          } catch (error) {
            if (
              error instanceof
                DOMException &&
              error.name ===
                'AbortError'
            ) {
              return;
            }

            setError(
              t(
                'searchError',
              ),
            );
          } finally {
            if (
              !controller.signal
                .aborted
            ) {
              setIsSearching(
                false,
              );
            }
          }
        },
        300,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );

      controller.abort();
    };
  }, [
    normalizedSearch,
    t,
  ]);

  return (
    <>
      <div className="mt-8">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            ⌕
          </span>

          <input
            type="search"
            value={search}
            onChange={(
              event,
            ) =>
              setSearch(
                event.target
                  .value,
              )
            }
            placeholder={t(
              'searchPlaceholder',
            )}
            aria-label={t(
              'searchLabel',
            )}
            className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>

        <div className="mt-3 flex min-h-5 items-center">
          {displayedIsSearching ? (
            <p className="text-sm text-muted">
              {t(
                'searching',
              )}
            </p>
          ) : displayedError ? (
            <p
              role="alert"
              className="text-sm text-red-500"
            >
              {
                displayedError
              }
            </p>
          ) : (
            <p className="text-sm text-muted">
              {t(
                'movementCount',
                {
                  count:
                    displayedMovements.length,
                },
              )}
            </p>
          )}
        </div>
      </div>

      {displayedMovements.length ===
        0 &&
      !displayedIsSearching ? (
        <div className="mt-5 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-semibold">
            {t(
              'emptyTitle',
            )}
          </p>

          <p className="mt-2 text-sm text-muted">
            {t(
              'emptyDescription',
            )}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displayedMovements.map(
            (
              movement,
            ) => (
              <MovementCard
                key={
                  movement.id
                }
                movement={
                  movement
                }
              />
            ),
          )}
        </div>
      )}
    </>
  );
}