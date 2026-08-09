import { getTranslations } from 'next-intl/server';

import LogoutButton from '@/components/auth/LogoutButton';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import Card from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';

export default async function AccountPage() {
  const t =
    await getTranslations(
      'account',
    );

  const user =
    await getCurrentUser();

  if (!user) {
    return null;
  }

  const displayName =
    user.athleteProfile
      ?.displayName ??
    user.email;

  const preferredWeightUnit =
    user.athleteProfile
      ?.preferredWeightUnit ??
    'KG';

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t('eyebrow')}
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          {t('title')}
        </h1>

        <p className="mt-2 text-muted">
          {t('description')}
        </p>
      </header>

      <Card className="mt-8 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent text-lg font-black text-accent">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-bold">
              {displayName}
            </p>

            <p className="truncate text-sm text-muted">
              {user.email}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {t(
                  'weightUnit.title',
                )}
              </p>

              <p className="mt-1 text-sm text-muted">
                {t(
                  'weightUnit.description',
                )}
              </p>
            </div>

            <span className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm font-semibold">
              {
                preferredWeightUnit
              }
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {t(
                  'language.title',
                )}
              </p>

              <p className="mt-1 text-sm text-muted">
                {t(
                  'language.description',
                )}
              </p>
            </div>

            <div className="w-full sm:w-40">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {t(
            'session.eyebrow',
          )}
        </p>

        <h2 className="mt-2 text-lg font-bold">
          {t(
            'session.title',
          )}
        </h2>

        <p className="mt-2 text-sm text-muted">
          {t(
            'session.description',
          )}
        </p>

        <div className="mt-5">
          <LogoutButton className="inline-flex items-center justify-center rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50">
            {t(
              'session.logout',
            )}
          </LogoutButton>
        </div>
      </Card>
    </div>
  );
}