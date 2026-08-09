'use client';

import {
  useMemo,
  useState,
} from 'react';
import {
  useLocale,
  useTranslations,
} from 'next-intl';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';

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

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}

export default function HistoryList({
  results,
}: Props) {
  const t =
    useTranslations('history');

  const typeT =
    useTranslations(
      'workoutTypes',
    );

  const resultTypeT =
    useTranslations(
      'resultTypes',
    );

  const locale =
    useLocale();

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

  const [
    rxFilter,
    setRxFilter,
  ] =
    useState<RxFilter>('ALL');

  function getWorkoutTypeName(
    key: string,
    fallback: string,
  ) {
    const translationKey =
      key.toLowerCase();

    return typeT.has(
      translationKey,
    )
      ? typeT(
          translationKey,
        )
      : fallback;
  }

  function getResultTypeName(
    key: string,
    fallback: string,
  ) {
    const translationKey =
      key.toLowerCase();

    return resultTypeT.has(
      translationKey,
    )
      ? resultTypeT(
          translationKey,
        )
      : fallback;
  }

  function formatResult(
    result: WorkoutHistoryResult,
  ) {
    switch (
      result.resultType.key
    ) {
      case 'TIME':
        return result.timeSeconds !==
          null
          ? formatDuration(
              result.timeSeconds,
            )
          : '—';

      case 'ROUNDS_REPS':
        return `${
          result.rounds ?? 0
        } + ${result.reps ?? 0}`;

      case 'REPS':
        return result.reps !== null
          ? t('repsValue', {
              count:
                result.reps,
            })
          : '—';

      case 'LOAD':
        return result.load !== null
          ? `${result.load} ${
              result.weightUnit ??
              ''
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
      locale,
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
      locale,
      {
        hour: 'numeric',
        minute: '2-digit',
      },
    ).format(new Date(value));
  }

  const workoutTypes =
    useMemo(() => {
      const types = new Map<
        string,
        string
      >();

      results.forEach(
        (result) => {
          types.set(
            result.workout
              .type.key,
            result.workout
              .type.name,
          );
        },
      );

      return Array.from(
        types.entries(),
      ).sort((a, b) =>
        getWorkoutTypeName(
          a[0],
          a[1],
        ).localeCompare(
          getWorkoutTypeName(
            b[0],
            b[1],
          ),
          locale,
        ),
      );
    }, [
      results,
      locale,
    ]);

  const resultTypes =
    useMemo(() => {
      const types = new Map<
        string,
        string
      >();

      results.forEach(
        (result) => {
          types.set(
            result.resultType.key,
            result.resultType.name,
          );
        },
      );

      return Array.from(
        types.entries(),
      ).sort((a, b) =>
        getResultTypeName(
          a[0],
          a[1],
        ).localeCompare(
          getResultTypeName(
            b[0],
            b[1],
          ),
          locale,
        ),
      );
    }, [
      results,
      locale,
    ]);

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
            workoutType !==
              'ALL' &&
            result.workout.type
              .key !==
              workoutType
          ) {
            return false;
          }

          if (
            resultType !==
              'ALL' &&
            result.resultType
              .key !==
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
            rxFilter ===
              'SCALED' &&
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
          {t('empty.title')}
        </p>

        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          {t(
            'empty.description',
          )}
        </p>

        <Link
          href="/workouts"
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong"
        >
          {t(
            'empty.browseWorkouts',
          )}
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
              {t(
                'filters.search',
              )}
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
              placeholder={t(
                'filters.searchPlaceholder',
              )}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label
              htmlFor="workoutType"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
            >
              {t(
                'filters.workoutType',
              )}
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
                {t(
                  'filters.allWorkoutTypes',
                )}
              </option>

              {workoutTypes.map(
                ([key, name]) => (
                  <option
                    key={key}
                    value={key}
                  >
                    {getWorkoutTypeName(
                      key,
                      name,
                    )}
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
              {t(
                'filters.resultType',
              )}
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
                {t(
                  'filters.allResultTypes',
                )}
              </option>

              {resultTypes.map(
                ([key, name]) => (
                  <option
                    key={key}
                    value={key}
                  >
                    {getResultTypeName(
                      key,
                      name,
                    )}
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
              {t(
                'filters.prescription',
              )}
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
                {t(
                  'filters.rxAndScaled',
                )}
              </option>

              <option value="RX">
                {t(
                  'filters.rxOnly',
                )}
              </option>

              <option value="SCALED">
                {t(
                  'filters.scaledOnly',
                )}
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted">
            {t(
              'filters.showing',
              {
                filtered:
                  filteredResults.length,
                total:
                  results.length,
              },
            )}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-sm font-semibold text-accent transition hover:text-accent-strong"
            >
              {t(
                'filters.clear',
              )}
            </button>
          )}
        </div>
      </section>

      {filteredResults.length ===
      0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="font-semibold">
            {t(
              'noMatches.title',
            )}
          </p>

          <p className="mt-2 text-sm text-muted">
            {t(
              'noMatches.description',
            )}
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-accent/40"
          >
            {t(
              'filters.clear',
            )}
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
                          result
                            .workout
                            .name
                        }
                      </Link>

                      {result.workout
                        .isBenchmark && (
                        <Badge>
                          {t(
                            'benchmark',
                          )}
                        </Badge>
                      )}

                      {result.isRx ? (
                        <Badge variant="accent">
                          Rx
                        </Badge>
                      ) : (
                        <Badge>
                          {t(
                            'scaled',
                          )}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-muted">
                      {getWorkoutTypeName(
                        result.workout
                          .type.key,
                        result.workout
                          .type.name,
                      )}
                      {' · '}
                      {getResultTypeName(
                        result
                          .resultType
                          .key,
                        result
                          .resultType
                          .name,
                      )}
                    </p>

                    {result.notes && (
                      <p className="mt-3 max-w-2xl text-sm text-muted">
                        {
                          result.notes
                        }
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