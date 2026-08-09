import {
  getLocale,
  getTranslations,
} from 'next-intl/server';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';
import { authenticatedApiFetch } from '@/lib/api';

import WorkoutTrendChart, {
  type TrendResult,
} from './components/WorkoutTrendChart';

type ResultType = {
  key: string;
  name: string;
};

type ProgressResult =
  TrendResult;

type WorkoutProgress = {
  workout: {
    id: string;
    name: string;
    isBenchmark: boolean;

    type: {
      key: string;
      name: string;
    };
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

type ProgressResponse = {
  summary: {
    totalResults: number;
    uniqueWorkouts: number;
    rxResults: number;
    scaledResults: number;
    rxRate: number;
    benchmarkWorkouts: number;
  };

  workouts:
    WorkoutProgress[];
};

async function getProgress(): Promise<ProgressResponse> {
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
        scaledResults: 0,
        rxRate: 0,
        benchmarkWorkouts: 0,
      },

      workouts: [],
    };
  }

  return (await response.json()) as ProgressResponse;
}

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

export default async function ProgressPage() {
  const t =
    await getTranslations(
      'progress',
    );

  const typeT =
    await getTranslations(
      'workoutTypes',
    );

  const resultTypeT =
    await getTranslations(
      'resultTypes',
    );

  const locale =
    await getLocale();

  const progress =
    await getProgress();

  const {
    summary,
    workouts,
  } = progress;

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
    result:
      | ProgressResult
      | null,
  ) {
    if (!result) {
      return '—';
    }

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

  function getImprovement(
    workout: WorkoutProgress,
  ) {
    if (
      workout.attemptCount < 2
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
          first.timeSeconds === 0
        ) {
          return null;
        }

        const secondsImproved =
          first.timeSeconds -
          best.timeSeconds;

        const percentage =
          (secondsImproved /
            first.timeSeconds) *
          100;

        return {
          improved:
            secondsImproved > 0,

          label:
            secondsImproved > 0
              ? t(
                  'improvement.faster',
                  {
                    value:
                      formatDuration(
                        secondsImproved,
                      ),
                  },
                )
              : secondsImproved ===
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
                            secondsImproved,
                          ),
                        ),
                    },
                  ),

          percentage:
            Math.abs(
              percentage,
            ),
        };
      }

      case 'REPS': {
        if (
          first.reps === null ||
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
              : difference === 0
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

      case 'LOAD': {
        if (
          first.load === null ||
          best.load === null
        ) {
          return null;
        }

        const firstKg =
          first.weightUnit ===
          'LB'
            ? first.load *
              0.45359237
            : first.load;

        const bestKg =
          best.weightUnit ===
          'LB'
            ? best.load *
              0.45359237
            : best.load;

        const differenceKg =
          bestKg - firstKg;

        const displayDifference =
          best.weightUnit ===
          'LB'
            ? differenceKg /
              0.45359237
            : differenceKg;

        const unit =
          best.weightUnit ??
          'KG';

        return {
          improved:
            differenceKg > 0,

          label:
            differenceKg > 0
              ? `+${displayDifference.toFixed(
                  1,
                )} ${unit}`
              : differenceKg ===
                  0
                ? t(
                    'improvement.noChange',
                  )
                : `${displayDifference.toFixed(
                    1,
                  )} ${unit}`,

          percentage:
            firstKg > 0
              ? Math.abs(
                  (differenceKg /
                    firstKg) *
                    100,
                )
              : null,
        };
      }

      case 'ROUNDS_REPS': {
        const firstRounds =
          first.rounds ?? 0;

        const firstReps =
          first.reps ?? 0;

        const bestRounds =
          best.rounds ?? 0;

        const bestReps =
          best.reps ?? 0;

        if (
          bestRounds >
          firstRounds
        ) {
          const difference =
            bestRounds -
            firstRounds;

          return {
            improved: true,

            label: t(
              'improvement.roundsGain',
              {
                count:
                  difference,
              },
            ),

            percentage: null,
          };
        }

        if (
          bestRounds ===
          firstRounds
        ) {
          const difference =
            bestReps -
            firstReps;

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

            percentage: null,
          };
        }

        return {
          improved: false,
          label: t(
            'improvement.noImprovement',
          ),
          percentage: null,
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
          {t('description')}
        </p>
      </header>

      {summary.totalResults ===
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

          <Link
            href="/workouts"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong"
          >
            {t(
              'empty.browseWorkouts',
            )}
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t(
                  'summary.resultsLogged',
                )}
              </p>

              <p className="mt-3 text-3xl font-black">
                {
                  summary.totalResults
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
                  summary.uniqueWorkouts
                }
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t(
                  'summary.rxRate',
                )}
              </p>

              <div className="mt-3 flex items-baseline gap-1">
                <p className="text-3xl font-black text-accent">
                  {
                    summary.rxRate
                  }
                </p>

                <span className="font-bold text-accent">
                  %
                </span>
              </div>

              <p className="mt-1 text-xs text-muted">
                {t(
                  'summary.rxBreakdown',
                  {
                    rx:
                      summary.rxResults,
                    scaled:
                      summary.scaledResults,
                  },
                )}
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
                  summary.benchmarkWorkouts
                }
              </p>
            </Card>
          </section>

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
              {workouts.map(
                (workout) => {
                  const improvement =
                    getImprovement(
                      workout,
                    );

                  return (
                    <Card
                      key={
                        workout
                          .workout.id
                      }
                      className="overflow-hidden"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/workouts/${workout.workout.id}`}
                                className="text-lg font-bold transition hover:text-accent"
                              >
                                {
                                  workout
                                    .workout
                                    .name
                                }
                              </Link>

                              {workout
                                .workout
                                .isBenchmark && (
                                <Badge>
                                  {t(
                                    'benchmark',
                                  )}
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-muted">
                              {getWorkoutTypeName(
                                workout
                                  .workout
                                  .type
                                  .key,
                                workout
                                  .workout
                                  .type
                                  .name,
                              )}
                              {' · '}
                              {getResultTypeName(
                                workout
                                  .resultType
                                  .key,
                                workout
                                  .resultType
                                  .name,
                              )}
                            </p>

                            <p className="mt-2 text-xs text-muted">
                              {t(
                                'attemptCount',
                                {
                                  count:
                                    workout.attemptCount,
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
                              {formatResult(
                                workout.firstResult,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              {formatDate(
                                workout
                                  .firstResult
                                  .performedAt,
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
                              {formatResult(
                                workout.personalBest,
                              )}
                            </p>

                            {workout.personalBest && (
                              <p className="mt-1 text-xs text-muted">
                                {formatDate(
                                  workout
                                    .personalBest
                                    .performedAt,
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
                              {formatResult(
                                workout.latestResult,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              {formatDate(
                                workout
                                  .latestResult
                                  .performedAt,
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
                              workout.resultType
                            }
                            history={
                              workout.history
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
        </>
      )}
    </div>
  );
}