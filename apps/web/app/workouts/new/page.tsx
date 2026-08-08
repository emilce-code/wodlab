import Link from 'next/link';
import { redirect } from 'next/navigation';

import { authenticatedApiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import WorkoutForm from './components/WorkoutForm';

export type WorkoutType = {
  key: string;
  name: string;
  description: string | null;
};

async function getWorkoutTypes(): Promise<WorkoutType[]> {
  const response = await authenticatedApiFetch('/workouts/types');

  if (!response?.ok) {
    return [];
  }

  return (await response.json()) as WorkoutType[];
}

export default async function NewWorkoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const workoutTypes = await getWorkoutTypes();

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/workouts"
            className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            ← Workout Library
          </Link>
        </div>

        <header>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Workout
          </h1>

          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Build a workout by adding sections and movements.
          </p>
        </header>

        <div className="mt-8">
          <WorkoutForm workoutTypes={workoutTypes} />
        </div>
      </div>
    </main>
  );
}