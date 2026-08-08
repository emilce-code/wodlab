import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { authenticatedApiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

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
  createdAt: string;
  updatedAt: string;

  type: {
    key: string;
    name: string;
  };

  createdByUser: {
    id: string;
    email: string;
  };

  sections: WorkoutSection[];
};

type WorkoutPageProps = {
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

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatMovementDetails(movement: WorkoutMovement): string[] {
  const details: string[] = [];

  if (movement.reps !== null) {
    details.push(`${movement.reps} reps`);
  }

  if (movement.weight !== null) {
    details.push(
      `${movement.weight}${movement.weightUnit ? ` ${movement.weightUnit}` : ''}`,
    );
  }

  if (movement.distance !== null) {
    details.push(`${movement.distance} m`);
  }

  if (movement.calories !== null) {
    details.push(`${movement.calories} cal`);
  }

  if (movement.durationSeconds !== null) {
    details.push(formatDuration(movement.durationSeconds));
  }

  return details;
}

export default async function WorkoutPage({
  params,
}: WorkoutPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const workout = await getWorkout(id);

  if (!workout) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/workouts"
            className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            ← Workout Library
          </Link>
        </div>

        <header>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">
              {workout.name}
            </h1>

            {workout.isBenchmark && (
              <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Benchmark
              </span>
            )}
          </div>

          <p className="mt-2 text-lg font-medium text-zinc-600 dark:text-zinc-400">
            {workout.type.name}
          </p>

          {workout.description && (
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              {workout.description}
            </p>
          )}
        </header>

        <div className="mt-8 space-y-6">
          {workout.sections.map((section) => (
            <section
              key={section.id}
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              {workout.sections.length > 1 && (
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Section {section.order}
                </p>
              )}

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold">
                  {section.type.name}
                </h2>

                {section.durationSeconds !== null && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs dark:bg-zinc-800">
                    {formatDuration(section.durationSeconds)}
                  </span>
                )}

                {section.rounds !== null && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs dark:bg-zinc-800">
                    {section.rounds} rounds
                  </span>
                )}
              </div>

              {section.repScheme.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Rep scheme
                  </p>

                  <p className="mt-1 text-2xl font-bold tracking-wide">
                    {section.repScheme.join('-')}
                  </p>
                </div>
              )}

              <div className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
                {section.movements.map((item) => {
                  const details = formatMovementDetails(item);

                  return (
                    <div
                      key={item.id}
                      className="py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">
                            {item.movement.name}
                          </h3>

                          {details.length > 0 && (
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                              {details.join(' · ')}
                            </p>
                          )}

                          {item.notes && (
                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        <span className="text-sm text-zinc-400">
                          {item.order}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {section.restSeconds !== null && (
                <p className="mt-5 border-t border-zinc-200 pt-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                  Rest: {formatDuration(section.restSeconds)}
                </p>
              )}

              {section.notes && (
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {section.notes}
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}