import { getTranslations } from 'next-intl/server';

import Card from '@/components/ui/Card';

export default async function AuthenticatedLoading() {
  const t = await getTranslations('states.loading');

  return (
    <div
      className="mx-auto max-w-5xl"
      role="status"
      aria-live="polite"
      aria-label={t('label')}
    >
      <span className="sr-only">{t('label')}</span>

      <div aria-hidden="true" className="animate-pulse">
        <div className="h-3 w-20 rounded-full bg-accent/20" />
        <div className="mt-4 h-10 w-full max-w-sm rounded-lg bg-surface-elevated" />
        <div className="mt-4 h-4 w-full max-w-xl rounded bg-surface-elevated" />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Card key={index} className="p-5">
              <div className="h-3 w-24 rounded bg-surface-elevated" />
              <div className="mt-5 h-8 w-16 rounded bg-surface-elevated" />
              <div className="mt-3 h-3 w-32 rounded bg-surface-elevated" />
            </Card>
          ))}
        </div>

        <Card className="mt-8 p-5">
          <div className="h-4 w-36 rounded bg-surface-elevated" />
          <div className="mt-5 space-y-3">
            <div className="h-14 rounded-lg bg-surface-elevated" />
            <div className="h-14 rounded-lg bg-surface-elevated" />
            <div className="h-14 rounded-lg bg-surface-elevated" />
          </div>
        </Card>
      </div>
    </div>
  );
}
