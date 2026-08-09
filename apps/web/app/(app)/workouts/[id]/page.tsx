import Link from 'next/link';
import { notFound } from 'next/navigation';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { authenticatedApiFetch } from '@/lib/api';

import LogResultForm from './components/LogResultForm';

type ResultType = {
  key: string;
  name: string;
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

  sections: WorkoutSection[];
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

  isRx: boolean;
  notes: string | null;

  createdAt: string;
  updatedAt: string;
};

type WorkoutResultSummary = {
  personalBest: WorkoutResult | null;
  lastResult: WorkoutResult | null;
  totalResults: number;
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

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

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

function getMovementPrescription(
  movement: WorkoutMovement,
) {
  const values: string[] = [];

  if (movement.reps !== null) {
    values.push(`${movement.reps} reps`);
  }

  if (movement.weight !== null) {
    values.push(
      `${movement.weight}${
        movement.weightUnit
          ? ` ${movement.weightUnit.toLowerCase()}`
          : ''
      }`,
    );
  }

  if (movement.distance !== null) {
    values.push(`${movement.distance} m`);
  }

  if (movement.calories !== null) {
    values.push(`${movement.calories} cal`);
  }

  if (movement.durationSeconds !== null) {
    values.push(
      formatDuration(
        movement.durationSeconds,
      ),
    );
  }

  return values.join(' · ');
}

function formatResult(
  result: WorkoutResult,
) {
  switch (result.resultType.key) {
    case 'TIME':
      return result.timeSeconds !== null
        ? formatDuration(result.timeSeconds)
        : '—';

    case 'ROUNDS_REPS': {
      const rounds = result.rounds ?? 0;
      const reps = result.reps ?? 0;

      return `${rounds} + ${reps}`;
    }

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

export default async function WorkoutPage({
  params,
}: Props) {
  const { id } = await params;

  const [
    workout,
    results,
    summary,
  ] = await Promise.all([
    getWorkout(id),
    getWorkoutResults(id),
    getWorkoutResultSummary(id),
  ]);

  if (!workout) {
    notFound();
  }

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
        ← Workouts
      </Link>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {workout.type.name}
          </p>

          {workout.isBenchmark && (
            <Badge>
              Benchmark
            </Badge>
          )}
        </div>

        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          {workout.name}
        </h1>

        {workout.description && (
          <p className="mt-4 max-w-2xl text-muted">
            {workout.description}
          </p>
        )}
      </header>

      <div className="mt-10 space-y-6">
        {workout.sections.map(
          (section, index) => (
            <Card
              key={section.id}
              className="overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                {workout.sections.length > 1 && (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Section {index + 1}
                  </p>
                )}

                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-bold">
                    {section.type.name}
                  </h2>

                  {section.rounds !== null && (
                    <Badge>
                      {section.rounds} rounds
                    </Badge>
                  )}

                  {section.durationSeconds !== null && (
                    <Badge>
                      {formatDuration(
                        section.durationSeconds,
                      )}
                    </Badge>
                  )}
                </div>

                {section.repScheme.length > 0 && (
                  <p className="mt-6 text-3xl font-black tracking-wide sm:text-4xl">
                    {section.repScheme.join(
                      ' — ',
                    )}
                  </p>
                )}

                <div className="mt-7 divide-y divide-border">
                  {section.movements.map(
                    (item) => {
                      const prescription =
                        getMovementPrescription(
                          item,
                        );

                      return (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0"
                        >
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

                          {prescription && (
                            <p className="shrink-0 text-sm font-medium text-muted">
                              {
                                prescription
                              }
                            </p>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>

                {(section.restSeconds !== null ||
                  section.notes) && (
                  <div className="mt-6 border-t border-border pt-5 text-sm text-muted">
                    {section.restSeconds !== null && (
                      <p>
                        Rest:{' '}
                        {formatDuration(
                          section.restSeconds,
                        )}
                      </p>
                    )}

                    {section.notes && (
                      <p className="mt-2">
                        {section.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ),
        )}
      </div>

      {workout.type.defaultResultType && (
        <section className="mt-12">
          <LogResultForm
            workoutId={workout.id}
            resultType={
              workout.type.defaultResultType
            }
          />
        </section>
      )}

      <section className="mt-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Your performance
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Track your progress
          </h2>

          {summary.totalResults > 0 && (
            <p className="mt-2 text-sm text-muted">
              {summary.totalResults}{' '}
              {summary.totalResults === 1
                ? 'result'
                : 'results'}{' '}
              recorded
            </p>
          )}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Personal best
            </p>

            {personalBest ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="text-3xl font-black text-accent">
                    {formatResult(
                      personalBest,
                    )}
                  </p>

                  {personalBest.isRx ? (
                    <Badge variant="accent">
                      Rx
                    </Badge>
                  ) : (
                    <Badge>
                      Scaled
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
                  No results recorded yet.
                </p>
              </>
            )}
          </Card>

          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Last result
            </p>

            {lastResult ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="text-3xl font-black">
                    {formatResult(
                      lastResult,
                    )}
                  </p>

                  {lastResult.isRx ? (
                    <Badge variant="accent">
                      Rx
                    </Badge>
                  ) : (
                    <Badge>
                      Scaled
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
                  No results recorded yet.
                </p>
              </>
            )}
          </Card>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground opacity-50"
          >
            Start Workout
          </button>
        </div>

        <p className="mt-3 text-xs text-muted">
          Live workout tracking is
          coming later.
        </p>
      </section>

      <section className="mt-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            History
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Previous results
          </h2>
        </div>

        {results.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
              +
            </div>

            <p className="mt-4 font-semibold">
              No results yet
            </p>

            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Your previous attempts and
              personal bests will appear here
              after you start logging workout
              results.
            </p>
          </div>
        ) : (
          <Card className="mt-5 overflow-hidden">
            <div className="divide-y divide-border">
              {results.map(
                (result) => (
                  <div
                    key={result.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {formatResult(
                            result,
                          )}
                        </p>

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
                        {formatDate(
                          result.performedAt,
                        )}
                      </p>

                      {result.notes && (
                        <p className="mt-2 text-sm text-muted">
                          {result.notes}
                        </p>
                      )}
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      {
                        result
                          .resultType
                          .name
                      }
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