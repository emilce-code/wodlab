import {
  getLocale,
  getTranslations,
} from 'next-intl/server';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import {
  Link,
} from '@/i18n/navigation';
import {
  authenticatedApiFetch,
} from '@/lib/api';
import {
  formatDate,
  formatDuration,
  formatMeasurementResult,
  formatWorkoutResult as formatWorkoutResultValue,
} from '@/lib/result-formatters';

import MovementTrendChart, {
  type MovementTrendResult,
} from './components/MovementTrendChart';
import WorkoutTrendChart, {
  type TrendResult,
} from './components/WorkoutTrendChart';

type ResultType = {
  key: string;
  name: string;
};

type ProgressResult =
  TrendResult;

type WorkoutProgressTrack = {
  workout: {
    id: string;
    name: string;
    isBenchmark: boolean;

    type: {
      key: string;
      name: string;
    };
  };

  level: {
    key: string;
    name: string;
  };

  resultType: ResultType;

  attemptCount: number;

  personalBest:
    ProgressResult | null;

  latestResult:
    ProgressResult;

  firstResult:
    ProgressResult;

  history:
    ProgressResult[];
};

type WorkoutProgressResponse = {
  summary: {
    totalResults: number;
    uniqueWorkouts: number;
    rxResults: number;
    rxRate: number;

    levelBreakdown: {
      key: string;
      name: string;
      count: number;
    }[];

    benchmarkWorkouts: number;
  };

  tracks:
    WorkoutProgressTrack[];
};

type MovementProgressResult =
  MovementTrendResult & {
    measurementType: {
      key: string;
      name: string;
    };
  };

type MovementProgressTrack = {
  movement: {
    id: string;
    name: string;

    category: {
      key: string;
      name: string;
    };
  };

  measurementType: {
    key: string;
    name: string;
  };

  reps:
    | number
    | null;

  attemptCount: number;

  personalBest:
    | MovementProgressResult
    | null;

  latestResult:
    MovementProgressResult;

  firstResult:
    MovementProgressResult;

  history:
    MovementProgressResult[];
};

type MovementProgressResponse = {
  summary: {
    totalResults: number;
    uniqueMovements: number;
    personalRecords: number;
  };

  tracks:
    MovementProgressTrack[];
};

async function getWorkoutProgress(): Promise<
  WorkoutProgressResponse
> {
  const response =
    await authenticatedApiFetch(
      '/workouts/results/progress',
    );

  if (!response?.ok) {
    return {
      summary: {
        totalResults: 0,
        uniqueWorkouts: 0,
        rxResults: 0,
        rxRate: 0,
        levelBreakdown: [],
        benchmarkWorkouts: 0,
      },

      tracks: [],
    };
  }

  return (
    await response.json()
  ) as WorkoutProgressResponse;
}

async function getMovementProgress(): Promise<
  MovementProgressResponse
> {
  const response =
    await authenticatedApiFetch(
      '/movements/results/progress',
    );

  if (!response?.ok) {
    return {
      summary: {
        totalResults: 0,
        uniqueMovements: 0,
        personalRecords: 0,
      },

      tracks: [],
    };
  }

  return (
    await response.json()
  ) as MovementProgressResponse;
}

export default async function ProgressPage() {
  const [
    t,
    typeT,
    resultTypeT,
    measurementT,
    categoryT,
    locale,
    workoutProgress,
    movementProgress,
  ] = await Promise.all([
    getTranslations(
      'progress',
    ),
    getTranslations(
      'workoutTypes',
    ),
    getTranslations(
      'resultTypes',
    ),
    getTranslations(
      'measurementTypes',
    ),
    getTranslations(
      'movementCategories',
    ),
    getLocale(),
    getWorkoutProgress(),
    getMovementProgress(),
  ]);

  const workoutSummary =
    workoutProgress.summary;

  const workoutTracks =
    workoutProgress.tracks;

  const movementSummary =
    movementProgress.summary;

  const movementTracks =
    movementProgress.tracks;

  const totalResults =
    workoutSummary.totalResults +
    movementSummary.totalResults;

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

  function getMeasurementName(
    key: string,
    fallback: string,
  ) {
    const translationKey =
      key.toLowerCase();

    return measurementT.has(
      translationKey,
    )
      ? measurementT(
          translationKey,
        )
      : fallback;
  }

  function getCategoryName(
    key: string,
    fallback: string,
  ) {
    const translationKey =
      key.toLowerCase();

    return categoryT.has(
      translationKey,
    )
      ? categoryT(
          translationKey,
        )
      : fallback;
  }

  function formatWorkoutResult(
    result:
      | ProgressResult
      | null,
  ) {
    if (!result) {
      return '—';
    }

    return formatWorkoutResultValue(result, {
      formatReps: (count) => t('repsValue', { count }),
    });
  }

  function formatMovementResult(
    result:
      | MovementProgressResult
      | null,
  ) {
    if (!result) {
      return '—';
    }

    return formatMeasurementResult(
      result.measurementType.key,
      result,
      {
        formatReps: (count) => t('repsValue', { count }),
      },
    );
  }

  function getWorkoutImprovement(
    workout: WorkoutProgressTrack,
  ) {
    if (
      workout.attemptCount <
      2
    ) {
      return null;
    }

    const first =
      workout.firstResult;

    const best =
      workout.personalBest;

    if (!best) {
      return null;
    }

    switch (
      workout.resultType.key
    ) {
      case 'TIME': {
        if (
          first.timeSeconds ===
            null ||
          best.timeSeconds ===
            null ||
          first.timeSeconds ===
            0
        ) {
          return null;
        }

        const difference =
          first.timeSeconds -
          best.timeSeconds;

        return {
          improved:
            difference > 0,

          label:
            difference > 0
              ? t(
                  'improvement.faster',
                  {
                    value:
                      formatDuration(
                        difference,
                      ),
                  },
                )
              : difference ===
                  0
                ? t(
                    'improvement.noChange',
                  )
                : t(
                    'improvement.slower',
                    {
                      value:
                        formatDuration(
                          Math.abs(
                            difference,
                          ),
                        ),
                    },
                  ),

          percentage:
            Math.abs(
              (difference /
                first.timeSeconds) *
                100,
            ),
        };
      }

      case 'REPS': {
        if (
          first.reps ===
            null ||
          best.reps === null
        ) {
          return null;
        }

        const difference =
          best.reps -
          first.reps;

        return {
          improved:
            difference > 0,

          label:
            difference > 0
              ? t(
                  'improvement.repsGain',
                  {
                    count:
                      difference,
                  },
                )
              : difference ===
                  0
                ? t(
                    'improvement.noChange',
                  )
                : t(
                    'improvement.repsLoss',
                    {
                      count:
                        Math.abs(
                          difference,
                        ),
                    },
                  ),

          percentage:
            first.reps > 0
              ? Math.abs(
                  (difference /
                    first.reps) *
                    100,
                )
              : null,
        };
      }

      default:
        return null;
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t('eyebrow')}
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          {t('title')}
        </h1>

        <p className="mt-4 max-w-2xl text-muted">
          {t(
            'description',
          )}
        </p>
      </header>

      {totalResults ===
      0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
            +
          </div>

          <p className="mt-4 font-semibold">
            {t(
              'empty.title',
            )}
          </p>

          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            {t(
              'empty.description',
            )}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/workouts"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong"
            >
              {t(
                'empty.browseWorkouts',
              )}
            </Link>

            <Link
              href="/movements"
              className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition hover:border-accent/40"
            >
              {t(
                'empty.browseMovements',
              )}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t(
                  'summary.workoutResults',
                )}
              </p>

              <p className="mt-3 text-3xl font-black">
                {
                  workoutSummary.totalResults
                }
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t(
                  'summary.workoutsTracked',
                )}
              </p>

              <p className="mt-3 text-3xl font-black">
                {
                  workoutSummary.uniqueWorkouts
                }
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t(
                  'summary.movementResults',
                )}
              </p>

              <p className="mt-3 text-3xl font-black">
                {
                  movementSummary.totalResults
                }
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t(
                  'summary.movementsTracked',
                )}
              </p>

              <p className="mt-3 text-3xl font-black">
                {
                  movementSummary.uniqueMovements
                }
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t(
                  'summary.personalRecords',
                )}
              </p>

              <p className="mt-3 text-3xl font-black text-accent">
                {
                  movementSummary.personalRecords
                }
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t(
                  'summary.benchmarksTracked',
                )}
              </p>

              <p className="mt-3 text-3xl font-black">
                {
                  workoutSummary.benchmarkWorkouts
                }
              </p>
            </Card>
          </section>

          {workoutSummary.levelBreakdown.length >
            0 && (
            <section className="mt-5">
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {t(
                    'summary.levelBreakdown',
                  )}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {workoutSummary.levelBreakdown.map(
                    (level) => (
                      <Badge
                        key={
                          level.key
                        }
                        variant={
                          level.key ===
                          'RX'
                            ? 'accent'
                            : undefined
                        }
                      >
                        {
                          level.name
                        }
                        :{' '}
                        {
                          level.count
                        }
                      </Badge>
                    ),
                  )}
                </div>
              </Card>
            </section>
          )}

          <section className="mt-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {t(
                  'movements.eyebrow',
                )}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {t(
                  'movements.title',
                )}
              </h2>

              <p className="mt-2 text-sm text-muted">
                {t(
                  'movements.description',
                )}
              </p>
            </div>

            {movementTracks.length ===
            0 ? (
              <Card className="mt-6 p-6">
                <p className="font-semibold">
                  {t(
                    'movements.emptyTitle',
                  )}
                </p>

                <p className="mt-2 text-sm text-muted">
                  {t(
                    'movements.emptyDescription',
                  )}
                </p>

                <Link
                  href="/movements"
                  className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline"
                >
                  {t(
                    'movements.browse',
                  )}
                </Link>
              </Card>
            ) : (
              <div className="mt-6 space-y-5">
                {movementTracks.map(
                  (track) => (
                    <Card
                      key={[
                        track.movement.id,
                        track.measurementType.key,
                        track.reps ??
                          'none',
                      ].join(
                        ':',
                      )}
                      className="overflow-hidden"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/movements/${track.movement.id}`}
                                className="text-lg font-bold transition hover:text-accent"
                              >
                                {
                                  track.movement.name
                                }
                              </Link>

                              {track.reps !==
                                null && (
                                <Badge variant="accent">
                                  {
                                    track.reps
                                  }
                                  RM
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-muted">
                              {getCategoryName(
                                track.movement.category.key,
                                track.movement.category.name,
                              )}
                              {' · '}
                              {getMeasurementName(
                                track.measurementType.key,
                                track.measurementType.name,
                              )}
                            </p>

                            <p className="mt-2 text-xs text-muted">
                              {t(
                                'attemptCount',
                                {
                                  count:
                                    track.attemptCount,
                                },
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                              {t(
                                'firstResult',
                              )}
                            </p>

                            <p className="mt-2 text-xl font-bold">
                              {formatMovementResult(
                                track.firstResult,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              {formatDate(
                                track.firstResult.performedAt,
                                locale,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                              {t(
                                'personalBest',
                              )}
                            </p>

                            <p className="mt-2 text-xl font-black text-accent">
                              {formatMovementResult(
                                track.personalBest,
                              )}
                            </p>

                            {track.personalBest && (
                              <p className="mt-1 text-xs text-muted">
                                {formatDate(
                                  track.personalBest.performedAt,
                                  locale,
                                )}
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                              {t(
                                'latest',
                              )}
                            </p>

                            <p className="mt-2 text-xl font-bold">
                              {formatMovementResult(
                                track.latestResult,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              {formatDate(
                                track.latestResult.performedAt,
                                locale,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 border-t border-border pt-6">
                          <div className="mb-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                              {t(
                                'trend.title',
                              )}
                            </p>

                            <p className="mt-1 text-sm text-muted">
                              {t(
                                'trend.description',
                              )}
                            </p>
                          </div>

                          <MovementTrendChart
                            measurementType={
                              track.measurementType
                            }
                            reps={
                              track.reps
                            }
                            history={
                              track.history
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  ),
                )}
              </div>
            )}
          </section>

          {workoutTracks.length >
            0 && (
            <section className="mt-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  {t(
                    'workouts.eyebrow',
                  )}
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {t(
                    'workouts.title',
                  )}
                </h2>

                <p className="mt-2 text-sm text-muted">
                  {t(
                    'workouts.description',
                  )}
                </p>
              </div>

              <div className="mt-6 space-y-5">
                {workoutTracks.map(
                  (track) => {
                    const improvement =
                      getWorkoutImprovement(
                        track,
                      );

                    return (
                      <Card
                        key={`${track.workout.id}:${track.level.key}`}
                        className="overflow-hidden"
                      >
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={`/workouts/${track.workout.id}`}
                                  className="text-lg font-bold transition hover:text-accent"
                                >
                                  {
                                    track.workout.name
                                  }
                                </Link>

                                {track.workout.isBenchmark && (
                                  <Badge>
                                    {t(
                                      'benchmark',
                                    )}
                                  </Badge>
                                )}

                                <Badge
                                  variant={
                                    track.level.key ===
                                    'RX'
                                      ? 'accent'
                                      : undefined
                                  }
                                >
                                  {
                                    track.level.name
                                  }
                                </Badge>
                              </div>

                              <p className="mt-1 text-sm text-muted">
                                {getWorkoutTypeName(
                                  track.workout.type.key,
                                  track.workout.type.name,
                                )}
                                {' · '}
                                {getResultTypeName(
                                  track.resultType.key,
                                  track.resultType.name,
                                )}
                              </p>

                              <p className="mt-2 text-xs text-muted">
                                {t(
                                  'attemptCount',
                                  {
                                    count:
                                      track.attemptCount,
                                  },
                                )}
                              </p>
                            </div>

                            {improvement && (
                              <div className="sm:text-right">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                                  {t(
                                    'improvement.label',
                                  )}
                                </p>

                                <p
                                  className={[
                                    'mt-1 text-lg font-black',
                                    improvement.improved
                                      ? 'text-accent'
                                      : '',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  {
                                    improvement.label
                                  }
                                </p>

                                {improvement.percentage !==
                                  null &&
                                  improvement.percentage >
                                    0 && (
                                  <p className="mt-0.5 text-xs text-muted">
                                    {improvement.percentage.toLocaleString(
                                      locale,
                                      {
                                        minimumFractionDigits:
                                          1,
                                        maximumFractionDigits:
                                          1,
                                      },
                                    )}
                                    %
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                {t(
                                  'firstResult',
                                )}
                              </p>

                              <p className="mt-2 text-xl font-bold">
                                {formatWorkoutResult(
                                  track.firstResult,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-muted">
                                {formatDate(
                                  track.firstResult.performedAt,
                                  locale,
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                {t(
                                  'personalBest',
                                )}
                              </p>

                              <p className="mt-2 text-xl font-black text-accent">
                                {formatWorkoutResult(
                                  track.personalBest,
                                )}
                              </p>

                              {track.personalBest && (
                                <p className="mt-1 text-xs text-muted">
                                  {formatDate(
                                    track.personalBest.performedAt,
                                    locale,
                                  )}
                                </p>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                {t(
                                  'latest',
                                )}
                              </p>

                              <p className="mt-2 text-xl font-bold">
                                {formatWorkoutResult(
                                  track.latestResult,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-muted">
                                {formatDate(
                                  track.latestResult.performedAt,
                                  locale,
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 border-t border-border pt-6">
                            <div className="mb-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                                {t(
                                  'trend.title',
                                )}
                              </p>

                              <p className="mt-1 text-sm text-muted">
                                {t(
                                  'trend.description',
                                )}
                              </p>
                            </div>

                            <WorkoutTrendChart
                              resultType={
                                track.resultType
                              }
                              history={
                                track.history
                              }
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  },
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
