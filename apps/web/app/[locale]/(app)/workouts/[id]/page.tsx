import {
  getLocale,
  getTranslations,
} from 'next-intl/server';
import { notFound } from 'next/navigation';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';
import { authenticatedApiFetch } from '@/lib/api';

import LogResultForm from './components/LogResultForm';

type ResultType = {
  key: string;
  name: string;
};

type WorkoutPrescription = {
  id: string;

  category: {
    key: string;
    name: string;
  };

  reps: number | null;
  weight: number | null;
  weightUnit: 'KG' | 'LB' | null;
  distance: number | null;
  calories: number | null;
  durationSeconds: number | null;
  notes: string | null;
};

type WorkoutMovement = {
  id: string;
  order: number;
  reps: number | null;
  weight: number | null;
  weightUnit: 'KG' | 'LB' | null;
  distance: number | null;
  calories: number | null;
  durationSeconds: number | null;
  notes: string | null;

  movement: {
    id: string;
    name: string;
  };

  prescriptions: WorkoutPrescription[];
};

type WorkoutSection = {
  id: string;
  order: number;
  rounds: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  repScheme: number[];
  notes: string | null;

  type: {
    key: string;
    name: string;
    defaultResultType: ResultType | null;
  };

  movements: WorkoutMovement[];
};

type WorkoutVariant = {
  id: string;
  name: string | null;
  notes: string | null;

  level: {
    key: string;
    name: string;
  };

  sections: WorkoutSection[];
};

type Workout = {
  id: string;
  name: string;
  description: string | null;
  isBenchmark: boolean;

  type: {
    key: string;
    name: string;
    defaultResultType: ResultType | null;
  };

  variants: WorkoutVariant[];
};

type WorkoutResult = {
  id: string;
  workoutId: string;
  athleteProfileId: string;
  resultTypeId: string;

  resultType: {
    key: string;
    name: string;
  };

  performedAt: string;

  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  load: number | null;
  weightUnit: 'KG' | 'LB' | null;

  workoutVariant: {
    id: string;
    name: string | null;

    level: {
      key: string;
      name: string;
    };
  } | null;

  prescriptionCategory: {
    key: string;
    name: string;
  } | null;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
};

type WorkoutResultSummary = {
  personalBest: WorkoutResult | null;
  lastResult: WorkoutResult | null;
  totalResults: number;
};

type PrescriptionCategory = {
  key: string;
  name: string;
};

type AthletePreferences = {
  preferredWeightUnit:
    | 'KG'
    | 'LB';

  preferredWorkoutLevelKey:
    string | null;

  preferredPrescriptionCategoryKey:
    string | null;
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function getWorkout(
  id: string,
): Promise<Workout | null> {
  const response =
    await authenticatedApiFetch(
      `/workouts/${id}`,
    );

  if (!response?.ok) {
    return null;
  }

  return (await response.json()) as Workout;
}

async function getWorkoutResults(
  id: string,
): Promise<WorkoutResult[]> {
  const response =
    await authenticatedApiFetch(
      `/workouts/${id}/results`,
    );

  if (!response?.ok) {
    return [];
  }

  return (await response.json()) as WorkoutResult[];
}

async function getWorkoutResultSummary(
  id: string,
): Promise<WorkoutResultSummary> {
  const response =
    await authenticatedApiFetch(
      `/workouts/${id}/results/summary`,
    );

  if (!response?.ok) {
    return {
      personalBest: null,
      lastResult: null,
      totalResults: 0,
    };
  }

  return (await response.json()) as WorkoutResultSummary;
}

async function getAthletePreferences(): Promise<
  AthletePreferences
> {
  const response =
    await authenticatedApiFetch(
      '/athlete-profile',
    );

  if (!response?.ok) {
    return {
      preferredWeightUnit:
        'KG',

      preferredWorkoutLevelKey:
        null,

      preferredPrescriptionCategoryKey:
        null,
    };
  }

  const profile =
    (await response.json()) as {
      preferredWeightUnit?:
        | 'KG'
        | 'LB';

      preferredWorkoutLevel?: {
        key: string;
      } | null;

      preferredPrescriptionCategory?: {
        key: string;
      } | null;
    };

  return {
    preferredWeightUnit:
      profile.preferredWeightUnit ??
      'KG',

    preferredWorkoutLevelKey:
      profile.preferredWorkoutLevel
        ?.key ??
      null,

    preferredPrescriptionCategoryKey:
      profile
        .preferredPrescriptionCategory
        ?.key ??
      null,
  };
}

export default async function WorkoutPage({
  params,
}: Props) {
  const { id } =
    await params;

  const [
    workout,
    results,
    summary,
    athletePreferences,
    t,
    workoutTypeT,
    resultTypeT,
    locale,
  ] = await Promise.all([
    getWorkout(id),
    getWorkoutResults(id),
    getWorkoutResultSummary(id),
    getAthletePreferences(),
    getTranslations(
      'workouts.detail',
    ),
    getTranslations(
      'workoutTypes',
    ),
    getTranslations(
      'resultTypes',
    ),
    getLocale(),
  ]);

  if (!workout) {
    notFound();
  }

  function formatDuration(
    totalSeconds: number,
  ) {
    const minutes =
      Math.floor(
        totalSeconds / 60,
      );

    const seconds =
      totalSeconds % 60;

    return `${minutes}:${String(
      seconds,
    ).padStart(2, '0')}`;
  }

  function getWorkoutTypeName(
    type: {
      key: string;
      name: string;
    },
  ) {
    const key =
      type.key
        .toLowerCase()
        .replaceAll(
          ' ',
          '_',
        )
        .replaceAll(
          '-',
          '_',
        );

    return workoutTypeT.has(
      key,
    )
      ? workoutTypeT(key)
      : type.name;
  }

  function getResultTypeName(
    type: ResultType,
  ) {
    const key =
      type.key.toLowerCase();

    return resultTypeT.has(
      key,
    )
      ? resultTypeT(key)
      : type.name;
  }

  function getMovementPrescription(
    movement: WorkoutMovement,
  ) {
    const values: string[] =
      [];

    if (
      movement.reps !==
      null
    ) {
      values.push(
        t('repsValue', {
          count:
            movement.reps,
        }),
      );
    }

    if (
      movement.weight !==
      null
    ) {
      values.push(
        `${movement.weight}${
          movement.weightUnit
            ? ` ${movement.weightUnit}`
            : ''
        }`,
      );
    }

    if (
      movement.distance !==
      null
    ) {
      values.push(
        `${movement.distance} m`,
      );
    }

    if (
      movement.calories !==
      null
    ) {
      values.push(
        `${movement.calories} cal`,
      );
    }

    if (
      movement.durationSeconds !==
      null
    ) {
      values.push(
        formatDuration(
          movement.durationSeconds,
        ),
      );
    }

    return values.join(
      ' · ',
    );
  }

  function getCategoryPrescription(
    prescription: WorkoutPrescription,
  ) {
    const values: string[] =
      [];

    if (
      prescription.reps !==
      null
    ) {
      values.push(
        t('repsValue', {
          count:
            prescription.reps,
        }),
      );
    }

    if (
      prescription.weight !==
      null
    ) {
      values.push(
        `${prescription.weight}${
          prescription.weightUnit
            ? ` ${prescription.weightUnit}`
            : ''
        }`,
      );
    }

    if (
      prescription.distance !==
      null
    ) {
      values.push(
        `${prescription.distance} m`,
      );
    }

    if (
      prescription.calories !==
      null
    ) {
      values.push(
        `${prescription.calories} cal`,
      );
    }

    if (
      prescription.durationSeconds !==
      null
    ) {
      values.push(
        formatDuration(
          prescription.durationSeconds,
        ),
      );
    }

    return values.join(
      ' · ',
    );
  }

  function formatResult(
    result: WorkoutResult,
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
          result.rounds ??
          0
        } + ${
          result.reps ?? 0
        }`;

      case 'REPS':
        return result.reps !==
          null
          ? t(
              'repsValue',
              {
                count:
                  result.reps,
              },
            )
          : '—';

      case 'LOAD':
        return result.load !==
          null
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
    ).format(
      new Date(value),
    );
  }

  const prescriptionCategories: PrescriptionCategory[] =
    Array.from(
      new Map(
        workout.variants
          .flatMap(
            (variant) =>
              variant.sections.flatMap(
                (section) =>
                  section.movements.flatMap(
                    (
                      movement,
                    ) =>
                      movement.prescriptions.map(
                        (
                          prescription,
                        ) =>
                          [
                            prescription
                              .category
                              .key,
                            prescription
                              .category,
                          ] as const,
                      ),
                  ),
              ),
          )
          .map(
            ([
              key,
              category,
            ]) => [
              key,
              category,
            ],
          ),
      ).values(),
    );

  const logResultVariants =
    workout.variants.map(
      (variant) => ({
        id: variant.id,
        name: variant.name,
        level:
          variant.level,
      }),
    );

  const personalBest =
    summary.personalBest;

  const lastResult =
    summary.lastResult;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/workouts"
        className="text-sm font-medium text-muted transition hover:text-foreground"
      >
        ←{' '}
        {t(
          'backToWorkouts',
        )}
      </Link>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {getWorkoutTypeName(
              workout.type,
            )}
          </p>

          {workout.isBenchmark && (
            <Badge>
              {t(
                'benchmark',
              )}
            </Badge>
          )}
        </div>

        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          {workout.name}
        </h1>

        {workout.description && (
          <p className="mt-4 max-w-2xl text-muted">
            {
              workout.description
            }
          </p>
        )}
      </header>

      <div className="mt-10 space-y-10">
        {workout.variants.map(
          (variant) => (
            <section
              key={
                variant.id
              }
            >
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <Badge variant="accent">
                  {
                    variant
                      .level.name
                  }
                </Badge>

                {variant.name && (
                  <h2 className="text-xl font-bold">
                    {
                      variant.name
                    }
                  </h2>
                )}
              </div>

              {variant.notes && (
                <p className="mb-5 text-sm text-muted">
                  {
                    variant.notes
                  }
                </p>
              )}

              <div className="space-y-6">
                {variant.sections.map(
                  (
                    section,
                    index,
                  ) => {
                    const prescriptionType =
                      getWorkoutTypeName(
                        section.type,
                      );

                    return (
                      <Card
                        key={
                          section.id
                        }
                        className="overflow-hidden"
                      >
                        <div className="p-6 sm:p-8">
                          {variant
                            .sections
                            .length >
                            1 && (
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                              {t(
                                'section',
                                {
                                  number:
                                    index +
                                    1,
                                },
                              )}
                            </p>
                          )}

                          <div className="mt-1 flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-bold">
                              {
                                prescriptionType
                              }
                            </h3>

                            {section.rounds !==
                              null && (
                              <Badge>
                                {t(
                                  'roundCount',
                                  {
                                    count:
                                      section.rounds,
                                  },
                                )}
                              </Badge>
                            )}

                            {section.durationSeconds !==
                              null && (
                              <Badge>
                                {formatDuration(
                                  section.durationSeconds,
                                )}
                              </Badge>
                            )}
                          </div>

                          {section
                            .repScheme
                            .length >
                            0 && (
                            <p className="mt-6 text-3xl font-black tracking-wide sm:text-4xl">
                              {section.repScheme.join(
                                ' — ',
                              )}
                            </p>
                          )}

                          <div className="mt-7 divide-y divide-border">
                            {section.movements.map(
                              (
                                item,
                              ) => {
                                const sharedPrescription =
                                  getMovementPrescription(
                                    item,
                                  );

                                return (
                                  <div
                                    key={
                                      item.id
                                    }
                                    className="py-4 first:pt-0 last:pb-0"
                                  >
                                    <div className="flex items-start justify-between gap-6">
                                      <div>
                                        <p className="font-semibold">
                                          {
                                            item
                                              .movement
                                              .name
                                          }
                                        </p>

                                        {item.notes && (
                                          <p className="mt-1 text-sm text-muted">
                                            {
                                              item.notes
                                            }
                                          </p>
                                        )}
                                      </div>

                                      {sharedPrescription && (
                                        <p className="shrink-0 text-sm font-medium text-muted">
                                          {
                                            sharedPrescription
                                          }
                                        </p>
                                      )}
                                    </div>

                                    {item
                                      .prescriptions
                                      .length >
                                      0 && (
                                      <div className="mt-3 space-y-2">
                                        {item.prescriptions.map(
                                          (
                                            prescription,
                                          ) => {
                                            const value =
                                              getCategoryPrescription(
                                                prescription,
                                              );

                                            return (
                                              <div
                                                key={
                                                  prescription.id
                                                }
                                                className="flex flex-wrap items-center gap-2 text-sm"
                                              >
                                                <Badge>
                                                  {
                                                    prescription
                                                      .category
                                                      .name
                                                  }
                                                </Badge>

                                                {value && (
                                                  <span className="font-medium text-muted">
                                                    {
                                                      value
                                                    }
                                                  </span>
                                                )}

                                                {prescription.notes && (
                                                  <span className="text-muted">
                                                    ·{' '}
                                                    {
                                                      prescription.notes
                                                    }
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>

                          {(section.restSeconds !==
                            null ||
                            section.notes) && (
                            <div className="mt-6 border-t border-border pt-5 text-sm text-muted">
                              {section.restSeconds !==
                                null && (
                                <p>
                                  {t(
                                    'rest',
                                  )}
                                  :{' '}
                                  {formatDuration(
                                    section.restSeconds,
                                  )}
                                </p>
                              )}

                              {section.notes && (
                                <p className="mt-2">
                                  {
                                    section.notes
                                  }
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  },
                )}
              </div>
            </section>
          ),
        )}
      </div>

      {workout.type
        .defaultResultType && (
        <section className="mt-12">
          <LogResultForm
            workoutId={
              workout.id
            }
            resultType={
              workout.type
                .defaultResultType
            }
            variants={
              logResultVariants
            }
            prescriptionCategories={
              prescriptionCategories
            }
            preferredWeightUnit={
              athletePreferences
                .preferredWeightUnit
            }
            preferredWorkoutLevelKey={
              athletePreferences
                .preferredWorkoutLevelKey
            }
            preferredPrescriptionCategoryKey={
              athletePreferences
                .preferredPrescriptionCategoryKey
            }
          />
        </section>
      )}

      <section className="mt-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {t(
              'performance.eyebrow',
            )}
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {t(
              'performance.title',
            )}
          </h2>

          {summary.totalResults >
            0 && (
            <p className="mt-2 text-sm text-muted">
              {t(
                'performance.resultCount',
                {
                  count:
                    summary.totalResults,
                },
              )}
            </p>
          )}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {t(
                'performance.personalBest',
              )}
            </p>

            {personalBest ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="text-3xl font-black text-accent">
                    {formatResult(
                      personalBest,
                    )}
                  </p>

                  {personalBest.workoutVariant && (
                    <Badge
                      variant={
                        personalBest
                          .workoutVariant
                          .level.key ===
                        'RX'
                          ? 'accent'
                          : undefined
                      }
                    >
                      {
                        personalBest
                          .workoutVariant
                          .level.name
                      }
                    </Badge>
                  )}

                  {personalBest.prescriptionCategory && (
                    <Badge>
                      {
                        personalBest
                          .prescriptionCategory
                          .name
                      }
                    </Badge>
                  )}
                </div>

                <p className="mt-2 text-sm text-muted">
                  {formatDate(
                    personalBest.performedAt,
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 text-3xl font-black">
                  —
                </p>

                <p className="mt-2 text-sm text-muted">
                  {t(
                    'performance.noResults',
                  )}
                </p>
              </>
            )}
          </Card>

          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {t(
                'performance.lastResult',
              )}
            </p>

            {lastResult ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="text-3xl font-black">
                    {formatResult(
                      lastResult,
                    )}
                  </p>

                  {lastResult.workoutVariant && (
                    <Badge
                      variant={
                        lastResult
                          .workoutVariant
                          .level.key ===
                        'RX'
                          ? 'accent'
                          : undefined
                      }
                    >
                      {
                        lastResult
                          .workoutVariant
                          .level.name
                      }
                    </Badge>
                  )}

                  {lastResult.prescriptionCategory && (
                    <Badge>
                      {
                        lastResult
                          .prescriptionCategory
                          .name
                      }
                    </Badge>
                  )}
                </div>

                <p className="mt-2 text-sm text-muted">
                  {formatDate(
                    lastResult.performedAt,
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 text-3xl font-black">
                  —
                </p>

                <p className="mt-2 text-sm text-muted">
                  {t(
                    'performance.noResults',
                  )}
                </p>
              </>
            )}
          </Card>
        </div>

        {results.length >
          0 && (
          <div className="mt-5">
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {getResultTypeName(
                  results[0]
                    .resultType,
                )}
              </p>

              <p className="mt-2 text-sm text-muted">
                {t(
                  'performance.resultCount',
                  {
                    count:
                      results.length,
                  },
                )}
              </p>
            </Card>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground opacity-50"
          >
            {t(
              'performance.startWorkout',
            )}
          </button>
        </div>

        <p className="mt-3 text-xs text-muted">
          {t(
            'performance.liveTrackingLater',
          )}
        </p>
      </section>
    </div>
  );
}