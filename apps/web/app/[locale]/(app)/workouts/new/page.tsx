import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { authenticatedApiFetch } from '@/lib/api';

import WorkoutForm from './components/WorkoutForm';

export type WorkoutType = {
  key: string;
  name: string;
  description: string | null;
};

export type WorkoutLevel = {
  key: string;
  name: string;
  description: string | null;
};

export type PrescriptionCategory = {
  key: string;
  name: string;
  description: string | null;
};

async function getWorkoutTypes(): Promise<
  WorkoutType[]
> {
  const response =
    await authenticatedApiFetch(
      '/workouts/types',
    );

  if (!response?.ok) {
    return [];
  }

  return (await response.json()) as WorkoutType[];
}

async function getWorkoutLevels(): Promise<
  WorkoutLevel[]
> {
  const response =
    await authenticatedApiFetch(
      '/workouts/levels',
    );

  if (!response?.ok) {
    return [];
  }

  return (await response.json()) as WorkoutLevel[];
}

async function getPrescriptionCategories(): Promise<
  PrescriptionCategory[]
> {
  const response =
    await authenticatedApiFetch(
      '/workouts/prescription-categories',
    );

  if (!response?.ok) {
    return [];
  }

  return (await response.json()) as PrescriptionCategory[];
}

export default async function NewWorkoutPage() {
  const t =
    await getTranslations(
      'workouts.create',
    );

  const [
    workoutTypes,
    workoutLevels,
    prescriptionCategories,
  ] = await Promise.all([
    getWorkoutTypes(),
    getWorkoutLevels(),
    getPrescriptionCategories(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/workouts"
            className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            ← {t('backToLibrary')}
          </Link>
        </div>

        <header>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>

          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {t('description')}
          </p>
        </header>

        <div className="mt-8">
          <WorkoutForm
            workoutTypes={
              workoutTypes
            }
            workoutLevels={
              workoutLevels
            }
            prescriptionCategories={
              prescriptionCategories
            }
          />
        </div>
      </div>
    </main>
  );
}