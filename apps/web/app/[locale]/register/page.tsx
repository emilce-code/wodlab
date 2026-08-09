'use client';

import {
  FormEvent,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';

import AuthShell from '@/components/auth/AuthShell';
import {
  Link,
  useRouter,
} from '@/i18n/navigation';

export default function RegisterPage() {
  const t =
    useTranslations(
      'auth.register',
    );

  const router =
    useRouter();

  const [email, setEmail] =
    useState('');

  const [
    displayName,
    setDisplayName,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (
      displayName.trim()
        .length < 2
    ) {
      setError(
        t('nameTooShort'),
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        t('passwordMismatch'),
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const response =
        await fetch(
          '/api/auth/register',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                email:
                  email.trim(),

                password,

                displayName:
                  displayName.trim(),
              }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        const message =
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ', ',
              )
            : data.message;

        setError(
          message ??
            t('error'),
        );

        return;
      }

      router.push('/login');
    } catch {
      setError(
        t('connectionError'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const passwordsMatch =
    !confirmPassword ||
    password ===
      confirmPassword;

  return (
    <AuthShell>
      <div>
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {t('eyebrow')}
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {t('title')}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            {t('description')}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="displayName"
              className="mb-1.5 block text-sm font-medium"
            >
              {t('name')}
            </label>

            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={
                displayName
              }
              onChange={(event) =>
                setDisplayName(
                  event.target.value,
                )
              }
              placeholder={t(
                'namePlaceholder',
              )}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium"
            >
              {t('email')}
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder={t(
                'emailPlaceholder',
              )}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
            >
              {t('password')}
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              placeholder={t(
                'passwordPlaceholder',
              )}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium"
            >
              {t(
                'confirmPassword',
              )}
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={
                confirmPassword
              }
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              placeholder={t(
                'confirmPasswordPlaceholder',
              )}
              className={[
                'w-full rounded-lg border bg-surface px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted',

                passwordsMatch
                  ? 'border-border focus:border-accent/60 focus:ring-2 focus:ring-accent/10'
                  : 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/10',
              ].join(' ')}
            />

            {!passwordsMatch && (
              <p className="mt-2 text-xs text-red-500">
                {t(
                  'passwordMismatch',
                )}
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3"
            >
              <p className="text-sm text-red-500">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !passwordsMatch
            }
            className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? t('submitting')
              : t('submit')}
          </button>
        </form>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-sm text-muted">
            {t(
              'alreadyHaveAccount',
            )}{' '}

            <Link
              href="/login"
              className="font-semibold text-foreground transition hover:text-accent"
            >
              {t('signIn')}
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}