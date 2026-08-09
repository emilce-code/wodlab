'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

export type WorkoutHistoryResult = {
  id: string;
  workoutId: string;
  athleteProfileId: string;
  resultTypeId: string;

  resultType: {
    key: string;
    name: string;
  };

  workout: {
    id: string;
    name: string;
    isBenchmark: boolean;

    type: {
      key: string;
      name: string;
    };
  };

  performedAt: string;

  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  load: number | null;
  weightUnit: 'KG' | 'LB' | null;

  isRx: boolean;
  notes: string | null;

  createdAt: string;
  updatedAt: string;
};

type Props = {
  results: WorkoutHistoryResult[];
};

type RxFilter =
  | 'ALL'
  | 'RX'
  | 'SCALED';

function formatDuration(
  seconds: number,
) {
  const minutes =
    Math.floor(seconds / 60);

  const remainingSeconds =
    seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}:00`;
  }

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}

function formatResult(
  result: WorkoutHistoryResult,
) {
  switch (result.resultType.key) {
    case 'TIME':
      return result.timeSeconds !== null
        ? formatDuration(
            result.timeSeconds,
          )
        : '—';

    case 'ROUNDS_REPS':
      return `${result.rounds ?? 0} + ${
        result.reps ?? 0
      }`;

    case 'REPS':
      return result.reps !== null
        ? `${result.reps} reps`
        : '—';

    case 'LOAD':
      return result.load !== null
        ? `${result.load} ${
            result.weightUnit ?? ''
          }`.trim()
        : '—';

    default:
      return '—';
  }
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  ).format(new Date(value));
}

function formatTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  ).format(new Date(value));
}

export default function HistoryList({
  results,
}: Props) {
  const [search, setSearch] =
    useState('');

  const [
    workoutType,
    setWorkoutType,
  ] = useState('ALL');

  const [
    resultType,
    setResultType,
  ] = useState('ALL');

  const [rxFilter, setRxFilter] =
    useState<RxFilter>('ALL');

  const workoutTypes = useMemo(() => {
    const types = new Map<
      string,
      string
    >();

    results.forEach((result) => {
      types.set(
        result.workout.type.key,
        result.workout.type.name,
      );
    });

    return Array.from(
      types.entries(),
    ).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [results]);

  const resultTypes = useMemo(() => {
    const types = new Map<
      string,
      string
    >();

    results.forEach((result) => {
      types.set(
        result.resultType.key,
        result.resultType.name,
      );
    });

    return Array.from(
      types.entries(),
    ).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [results]);

  const filteredResults =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return results.filter(
        (result) => {
          if (
            normalizedSearch &&
            !result.workout.name
              .toLowerCase()
              .includes(
                normalizedSearch,
              )
          ) {
            return false;
          }

          if (
            workoutType !== 'ALL' &&
            result.workout.type.key !==
              workoutType
          ) {
            return false;
          }

          if (
            resultType !== 'ALL' &&
            result.resultType.key !==
              resultType
          ) {
            return false;
          }

          if (
            rxFilter === 'RX' &&
            !result.isRx
          ) {
            return false;
          }

          if (
            rxFilter === 'SCALED' &&
            result.isRx
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      results,
      search,
      workoutType,
      resultType,
      rxFilter,
    ]);

  const hasActiveFilters =
    search.trim() !== '' ||
    workoutType !== 'ALL' ||
    resultType !== 'ALL' ||
    rxFilter !== 'ALL';

  function clearFilters() {
    setSearch('');
    setWorkoutType('ALL');
    setResultType('ALL');
    setRxFilter('ALL');
  }

  if (results.length === 0) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
          +
        </div>

        <p className="mt-4 font-semibold">
          No workout history yet
        </p>

        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Your logged workout results
          will appear here.
        </p>

        <Link
          href="/workouts"
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong"
        >
          Browse workouts
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="mt-10 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <label
              htmlFor="historySearch"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              Search
            </label>

            <input
              id="historySearch"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Workout name..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label
              htmlFor="workoutType"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              Workout type
            </label>

            <select
              id="workoutType"
              value={workoutType}
              onChange={(event) =>
                setWorkoutType(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              <option value="ALL">
                All types
              </option>

              {workoutTypes.map(
                ([key, name]) => (
                  <option
                    key={key}
                    value={key}
                  >
                    {name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="resultType"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              Result type
            </label>

            <select
              id="resultType"
              value={resultType}
              onChange={(event) =>
                setResultType(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              <option value="ALL">
                All results
              </option>

              {resultTypes.map(
                ([key, name]) => (
                  <option
                    key={key}
                    value={key}
                  >
                    {name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="rxFilter"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              Prescription
            </label>

            <select
              id="rxFilter"
              value={rxFilter}
              onChange={(event) =>
                setRxFilter(
                  event.target
                    .value as RxFilter,
                )
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              <option value="ALL">
                Rx + Scaled
              </option>

              <option value="RX">
                Rx only
              </option>

              <option value="SCALED">
                Scaled only
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted">
            Showing{' '}
            <span className="font-semibold text-foreground">
              {filteredResults.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-foreground">
              {results.length}
            </span>{' '}
            results
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-accent transition hover:text-accent-strong"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {filteredResults.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="font-semibold">
            No matching results
          </p>

          <p className="mt-2 text-sm text-muted">
            Try changing or clearing
            your filters.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-accent/40"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredResults.map(
            (result) => (
              <Card
                key={result.id}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/workouts/${result.workout.id}`}
                        className="truncate text-lg font-bold transition hover:text-accent"
                      >
                        {
                          result.workout
                            .name
                        }
                      </Link>

                      {result.workout
                        .isBenchmark && (
                        <Badge>
                          Benchmark
                        </Badge>
                      )}

                      {result.isRx ? (
                        <Badge variant="accent">
                          Rx
                        </Badge>
                      ) : (
                        <Badge>
                          Scaled
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-muted">
                      {
                        result.workout
                          .type.name
                      }
                      {' · '}
                      {
                        result.resultType
                          .name
                      }
                    </p>

                    {result.notes && (
                      <p className="mt-3 max-w-2xl text-sm text-muted">
                        {result.notes}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 sm:text-right">
                    <p className="text-2xl font-black">
                      {formatResult(
                        result,
                      )}
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      {formatDate(
                        result.performedAt,
                      )}
                    </p>

                    <p className="mt-0.5 text-xs text-muted">
                      {formatTime(
                        result.performedAt,
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            ),
          )}
        </div>
      )}
    </>
  );
}