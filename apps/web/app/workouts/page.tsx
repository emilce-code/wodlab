import Link from 'next/link';
import { redirect } from 'next/navigation';

import { authenticatedApiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

type Workout = {
  id: string;
  name: string;
  description: string | null;
  isBenchmark: boolean;

  type: {
    key: string;
    name: string;
  };

  sections: {
    id: string;
    order: number;
    repScheme: number[];

    movements: {
      id: string;
      movement: {
        id: string;
        name: string;
      };
    }[];
  }[];
};

async function getWorkouts(): Promise<Workout[]> {
  const response = await authenticatedApiFetch('/workouts');

  if (!response?.ok) {
    return [];
  }

  return (await response.json()) as Workout[];
}

export default async function WorkoutsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const workouts = await getWorkouts();

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Workout Library
            </h1>

            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Browse workouts available in WODLab.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="text-sm font-medium underline underline-offset-4"
          >
            Dashboard
          </Link>

          <Link
            href="/workouts/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Create workout
          </Link>
        </header>

        {workouts.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <h2 className="font-semibold">
              No workouts yet
            </h2>

            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Your workout library is currently empty.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
              {workouts.length}{' '}
              {workouts.length === 1 ? 'workout' : 'workouts'}
            </p>

            <section className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/workouts/${workout.id}`}
                  className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold group-hover:underline">
                        {workout.name}
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {workout.type.name}
                      </p>
                    </div>

                    {workout.isBenchmark && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        Benchmark
                      </span>
                    )}
                  </div>

                  {workout.description && (
                    <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {workout.description}
                    </p>
                  )}

                  <div className="mt-5 space-y-4">
                    {workout.sections.map((section) => (
                      <div key={section.id}>
                        {section.repScheme.length > 0 && (
                          <p className="text-sm font-semibold">
                            {section.repScheme.join('-')}
                          </p>
                        )}

                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {section.movements
                            .map((item) => item.movement.name)
                            .join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}