'use client';

import { useEffect, useState } from 'react';

import MovementCard, {
  Movement,
} from './MovementCard';

type Props = {
  initialMovements: Movement[];
};

export default function MovementLibrary({
  initialMovements,
}: Props) {
  const [search, setSearch] = useState('');
  const [movements, setMovements] =
    useState<Movement[]>(initialMovements);
  const [isSearching, setIsSearching] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const normalizedSearch = search.trim();

    if (!normalizedSearch) {
      setMovements(initialMovements);
      setIsSearching(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/movements?search=${encodeURIComponent(
            normalizedSearch,
          )}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            'Unable to search movements',
          );
        }

        const data =
          (await response.json()) as Movement[];

        setMovements(data);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        setError('Unable to search movements.');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, initialMovements]);

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
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search movements or aliases..."
            className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>

        <div className="mt-3 flex min-h-5 items-center">
          {isSearching ? (
            <p className="text-sm text-muted">
              Searching...
            </p>
          ) : error ? (
            <p className="text-sm text-red-500">
              {error}
            </p>
          ) : (
            <p className="text-sm text-muted">
              {movements.length}{' '}
              {movements.length === 1
                ? 'movement'
                : 'movements'}
            </p>
          )}
        </div>
      </div>

      {movements.length === 0 && !isSearching ? (
        <div className="mt-5 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-semibold">
            No movements found
          </p>

          <p className="mt-2 text-sm text-muted">
            Try searching by movement name or alias.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {movements.map((movement) => (
            <MovementCard
              key={movement.id}
              movement={movement}
            />
          ))}
        </div>
      )}
    </>
  );
}