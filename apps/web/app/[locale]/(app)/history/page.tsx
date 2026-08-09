import { getTranslations } from 'next-intl/server';

import { authenticatedApiFetch } from '@/lib/api';

import HistoryList, {
  type WorkoutHistoryResult,
} from './components/HistoryList';

async function getHistory(): Promise<
  WorkoutHistoryResult[]
> {
  const response =
    await authenticatedApiFetch(
      '/workouts/results/history',
    );

  if (!response?.ok) {
    return [];
  }

  return (await response.json()) as WorkoutHistoryResult[];
}

export default async function HistoryPage() {
  const t =
    await getTranslations(
      'history',
    );

  const results =
    await getHistory();

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

      <HistoryList
        results={results}
      />
    </div>
  );
}