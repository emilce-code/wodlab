'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AuthenticatedError({ error, reset }: Props) {
  const t = useTranslations('states.error');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center py-10">
      <Card className="w-full p-6 text-center sm:p-8">
        <div
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-xl font-bold text-red-500"
        >
          !
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
          {t('eyebrow')}
        </p>

        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          {t('title')}
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted sm:text-base">
          {t('description')}
        </p>

        <Button type="button" onClick={reset} className="mt-6 min-w-32">
          {t('retry')}
        </Button>
      </Card>
    </div>
  );
}
