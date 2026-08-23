import {
  getLocale,
  getTranslations,
} from 'next-intl/server';
import {
  notFound,
} from 'next/navigation';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import {
  Link,
} from '@/i18n/navigation';
import {
  authenticatedApiFetch,
} from '@/lib/api';
import {
  getCurrentUser,
} from '@/lib/auth';

import LogMovementResultForm from './components/LogMovementResultForm';
import MovementProgressChart from './components/MovementProgressChart';

type WeightUnit =
  | 'KG'
  | 'LB';

type MeasurementType = {
  key: string;
  name: string;
};

type Movement = {
  id: string;
  name: string;
  aliases: string[];
  isFoundational: boolean;
  official: boolean;

  category: {
    key: string;
    name: string;
  };

  measurementTypes:
    MeasurementType[];
};

type MovementResult = {
  id: string;

  measurementType: {
    key: string;
    name: string;
  };

  performedAt: string;

  reps: number | null;

  load:
    | number
    | string
    | null;

  weightUnit:
    | WeightUnit
    | null;

  distance:
    | number
    | null;

  durationSeconds:
    | number
    | null;

  calories:
    | number
    | null;

  notes:
    | string
    | null;

  createdAt: string;
  updatedAt: string;
};

type WeightRecord = {
  reps: number;

  result:
    | MovementResult
    | null;
};

type PersonalRecordGroup = {
  measurementType: {
    key: string;
    name: string;
  };

  result?:
    | MovementResult
    | null;

  records?:
    WeightRecord[];
};

type MovementResultSummary = {
  movement: {
    id: string;
    name: string;
  };

  totalResults: number;

  lastResult:
    | MovementResult
    | null;

  personalRecords:
    PersonalRecordGroup[];
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function getMovement(
  id: string,
): Promise<
  Movement | null
> {
  const response =
    await authenticatedApiFetch(
      `/movements/${id}`,
    );

  if (!response?.ok) {
    return null;
  }

  return (
    await response.json()
  ) as Movement;
}

async function getMovementResults(
  id: string,
): Promise<
  MovementResult[]
> {
  const response =
    await authenticatedApiFetch(
      `/movements/${id}/results`,
    );

  if (!response?.ok) {
    return [];
  }

  return (
    await response.json()
  ) as MovementResult[];
}

async function getMovementSummary(
  id: string,
): Promise<
  MovementResultSummary | null
> {
  const response =
    await authenticatedApiFetch(
      `/movements/${id}/results/summary`,
    );

  if (!response?.ok) {
    return null;
  }

  return (
    await response.json()
  ) as MovementResultSummary;
}

export default async function MovementDetailPage({
  params,
}: Props) {
  const { id } =
    await params;

  const [
    movement,
    results,
    summary,
    user,
    t,
    categoryT,
    measurementT,
    locale,
  ] = await Promise.all([
    getMovement(id),
    getMovementResults(
      id,
    ),
    getMovementSummary(
      id,
    ),
    getCurrentUser(),
    getTranslations(
      'movements.detail',
    ),
    getTranslations(
      'movementCategories',
    ),
    getTranslations(
      'measurementTypes',
    ),
    getLocale(),
  ]);

  if (!movement) {
    notFound();
  }

  const currentMovement =
    movement;

  const preferredWeightUnit =
    user?.athleteProfile
      ?.preferredWeightUnit ??
    'KG';

  function getCategoryName() {
    const key =
      currentMovement.category.key.toLowerCase();

    return categoryT.has(
      key,
    )
      ? categoryT(key)
      : currentMovement.category.name;
  }

  function getMeasurementName(
    type: {
      key: string;
      name: string;
    },
  ) {
    const key =
      type.key.toLowerCase();

    return measurementT.has(
      key,
    )
      ? measurementT(key)
      : type.name;
  }

  function formatDuration(
    totalSeconds: number,
  ) {
    const minutes =
      Math.floor(
        totalSeconds /
          60,
      );

    const seconds =
      totalSeconds %
      60;

    return `${minutes}:${String(
      seconds,
    ).padStart(
      2,
      '0',
    )}`;
  }

  function formatDate(
    value: string,
  ) {
    return new Intl.DateTimeFormat(
      locale,
      {
        month:
          'short',
        day:
          'numeric',
        year:
          'numeric',
      },
    ).format(
      new Date(
        value,
      ),
    );
  }

  function formatResult(
    result: MovementResult,
  ) {
    switch (
      result
        .measurementType
        .key
    ) {
      case 'REPS':
        return t(
          'repsValue',
          {
            count:
              result.reps ??
              0,
          },
        );

      case 'WEIGHT':
        return `${
          result.reps ??
          0
        } × ${
          result.load ??
          '—'
        } ${
          result.weightUnit ??
          ''
        }`.trim();

      case 'DISTANCE':
        return `${
          result.distance ??
          0
        } m`;

      case 'DURATION':
        return result.durationSeconds !==
          null
          ? formatDuration(
              result.durationSeconds,
            )
          : '—';

      case 'CALORIES':
        return `${
          result.calories ??
          0
        } cal`;

      default:
        return '—';
    }
  }

  const personalRecords =
    summary
      ?.personalRecords ??
    [];

  const hasPersonalRecords =
    personalRecords.some(
      (group) =>
        Boolean(
          group.result,
        ) ||
        (
          group.records
            ?.length ??
          0
        ) > 0,
    );

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/movements"
        className="text-sm font-medium text-muted transition hover:text-foreground"
      >
        ←{' '}
        {t(
          'backToMovements',
        )}
      </Link>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {getCategoryName()}
          </p>

          {currentMovement.isFoundational && (
            <Badge>
              {t(
                'foundational',
              )}
            </Badge>
          )}
        </div>

        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          {
            currentMovement.name
          }
        </h1>

        {currentMovement.aliases.length >
          0 && (
          <p className="mt-3 text-sm text-muted">
            {t(
              'alsoKnownAs',
            )}
            :{' '}
            {currentMovement.aliases.join(
              ' · ',
            )}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {currentMovement.measurementTypes.map(
            (type) => (
              <Badge
                key={
                  type.key
                }
              >
                {getMeasurementName(
                  type,
                )}
              </Badge>
            ),
          )}
        </div>
      </header>

      <section className="mt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t(
            'personalRecords.eyebrow',
          )}
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          {t(
            'personalRecords.title',
          )}
        </h2>

        <p className="mt-2 text-sm text-muted">
          {t(
            'personalRecords.description',
          )}
        </p>

        {!hasPersonalRecords ? (
          <Card className="mt-5 p-6">
            <p className="font-semibold">
              {t(
                'personalRecords.emptyTitle',
              )}
            </p>

            <p className="mt-2 text-sm text-muted">
              {t(
                'personalRecords.emptyDescription',
              )}
            </p>
          </Card>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {personalRecords.flatMap(
              (group) => {
                if (
                  group
                    .measurementType
                    .key ===
                  'WEIGHT'
                ) {
                  return (
                    group.records ??
                    []
                  )
                    .filter(
                      (
                        record,
                      ) =>
                        record.result !==
                        null,
                    )
                    .map(
                      (
                        record,
                      ) => {
                        const result =
                          record.result;

                        if (!result) {
                          return null;
                        }

                        return (
                          <Card
                            key={`WEIGHT-${record.reps}`}
                            className="p-5"
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                              {
                                record.reps
                              }
                              RM
                            </p>

                            <p className="mt-3 text-3xl font-black text-accent">
                              {
                                result.load
                              }{' '}
                              {
                                result.weightUnit
                              }
                            </p>

                            <p className="mt-2 text-sm text-muted">
                              {formatDate(
                                result.performedAt,
                              )}
                            </p>
                          </Card>
                        );
                      },
                    );
                }

                if (
                  !group.result
                ) {
                  return [];
                }

                return [
                  <Card
                    key={
                      group
                        .measurementType
                        .key
                    }
                    className="p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      {getMeasurementName(
                        group.measurementType,
                      )}
                    </p>

                    <p className="mt-3 text-3xl font-black text-accent">
                      {formatResult(
                        group.result,
                      )}
                    </p>

                    <p className="mt-2 text-sm text-muted">
                      {formatDate(
                        group.result
                          .performedAt,
                      )}
                    </p>
                  </Card>,
                ];
              },
            )}
          </div>
        )}
      </section>

      <section className="mt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t(
            'progress.eyebrow',
          )}
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          {t(
            'progress.title',
          )}
        </h2>

        <p className="mt-2 text-sm text-muted">
          {t(
            'progress.description',
          )}
        </p>

        <Card className="mt-5 p-5 sm:p-6">
          <MovementProgressChart
            measurementTypes={
              currentMovement.measurementTypes
            }
            results={
              results
            }
          />
        </Card>
      </section>

      <section className="mt-12">
        <LogMovementResultForm
          movementId={
            currentMovement.id
          }
          measurementTypes={
            currentMovement.measurementTypes
          }
          preferredWeightUnit={
            preferredWeightUnit
          }
        />
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {t(
                'history.eyebrow',
              )}
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {t(
                'history.title',
              )}
            </h2>
          </div>

          {results.length >
            0 && (
            <p className="text-sm text-muted">
              {t(
                'history.resultCount',
                {
                  count:
                    results.length,
                },
              )}
            </p>
          )}
        </div>

        {results.length ===
        0 ? (
          <Card className="mt-5 p-6">
            <p className="font-semibold">
              {t(
                'history.emptyTitle',
              )}
            </p>

            <p className="mt-2 text-sm text-muted">
              {t(
                'history.emptyDescription',
              )}
            </p>
          </Card>
        ) : (
          <Card className="mt-5 overflow-hidden">
            <div className="divide-y divide-border">
              {results.map(
                (
                  result,
                ) => (
                  <div
                    key={
                      result.id
                    }
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold">
                          {formatResult(
                            result,
                          )}
                        </p>

                        <Badge>
                          {getMeasurementName(
                            result.measurementType,
                          )}
                        </Badge>
                      </div>

                      {result.notes && (
                        <p className="mt-2 text-sm text-muted">
                          {
                            result.notes
                          }
                        </p>
                      )}
                    </div>

                    <p className="shrink-0 text-sm text-muted">
                      {formatDate(
                        result.performedAt,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}