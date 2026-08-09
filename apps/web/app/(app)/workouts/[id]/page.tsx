import Link from 'next/link';
import { notFound } from 'next/navigation';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { authenticatedApiFetch } from '@/lib/api';

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
  };

  sections: WorkoutSection[];
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function getWorkout(id: string): Promise<Workout | null> {
  const response = await authenticatedApiFetch(`/workouts/${id}`);

  if (!response?.ok) {
    return null;
  }

  return (await response.json()) as Workout;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
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
    values.push(formatDuration(movement.durationSeconds));
  }

  return values.join(' · ');
}

export default async function WorkoutPage({
  params,
}: Props) {
  const { id } = await params;

  const workout = await getWorkout(id);

  if (!workout) {
    notFound();
  }

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
            <Badge>Benchmark</Badge>
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
        {workout.sections.map((section, index) => (
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
                  {section.repScheme.join(' — ')}
                </p>
              )}

              <div className="mt-7 divide-y divide-border">
                {section.movements.map((item) => {
                  const prescription =
                    getMovementPrescription(item);

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold">
                          {item.movement.name}
                        </p>

                        {item.notes && (
                          <p className="mt-1 text-sm text-muted">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {prescription && (
                        <p className="shrink-0 text-sm font-medium text-muted">
                          {prescription}
                        </p>
                      )}
                    </div>
                  );
                })}
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
        ))}
      </div>

      <section className="mt-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Your performance
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Track your progress
          </h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Personal best
            </p>

            <p className="mt-4 text-3xl font-black">
              —
            </p>

            <p className="mt-2 text-sm text-muted">
              No results recorded yet.
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Last result
            </p>

            <p className="mt-4 text-3xl font-black">
              —
            </p>

            <p className="mt-2 text-sm text-muted">
              No results recorded yet.
            </p>
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

          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground opacity-50"
          >
            Log Result
          </button>
        </div>

        <p className="mt-3 text-xs text-muted">
          Workout tracking is coming next.
        </p>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              History
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Previous results
            </h2>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
            +
          </div>

          <p className="mt-4 font-semibold">
            No results yet
          </p>

          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Your previous attempts and personal bests
            will appear here after you start logging
            workout results.
          </p>
        </div>
      </section>
    </div>
  );
}