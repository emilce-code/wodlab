'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import Wordmark from '@/components/brand/Wordmark';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { BRAND } from '@/lib/brand';

type Props = {
  children: ReactNode;
};

export default function AuthShell({
  children,
}: Props) {
  const t =
    useTranslations('auth.shell');

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-border bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl"
          />

          <div className="relative z-10 flex items-start justify-between gap-6">
            <Wordmark />

            <div className="w-36">
              <LanguageSwitcher />
            </div>
          </div>

          <div className="relative z-10 max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              {t('eyebrow')}
            </p>

            <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
              {t('titleLine1')}
              <br />
              {t('titleLine2')}
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-muted">
              {t('description')}
            </p>

            <div className="mt-10 flex items-center gap-3">
              <div className="h-1 w-12 rounded-full bg-accent" />
              <div className="h-1 w-3 rounded-full bg-accent/40" />
              <div className="h-1 w-3 rounded-full bg-accent/20" />
            </div>
          </div>

          <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {BRAND.tagline}
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-start justify-between gap-5 lg:hidden">
              <Wordmark />

              <div className="w-32">
                <LanguageSwitcher />
              </div>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}