import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import AuthShell from '@/components/auth/AuthShell';

type LoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LoginPage({
  params,
}: LoginPageProps) {
  const { locale } = await params;

  const t =
    await getTranslations({
      locale,
      namespace: 'auth.login',
    });

  const audience =
    process.env.AUTH0_AUDIENCE;

  if (!audience) {
    throw new Error(
      'AUTH0_AUDIENCE is not configured',
    );
  }

  const returnTo =
    `/${locale}/dashboard`;

  const authLoginUrl =
    '/auth/login' +
    `?connection=google-oauth2` +
    `&audience=${encodeURIComponent(
      audience,
    )}` +
    `&returnTo=${encodeURIComponent(
      returnTo,
    )}`;

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

        <div className="mt-8">
          <a
            href={authLoginUrl}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
          >
            <GoogleIcon />

            {t('submit')}
          </a>
        </div>
        <div className="mt-6 text-center text-sm text-muted">
          <span>
            {t('noAccount')}{' '}
          </span>

          <Link
            href="/register"
            className="font-semibold text-accent transition hover:text-accent-strong"
          >
            {t('createAccount')}
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path
        fill="currentColor"
        d="M21.35 12.2c0-.74-.07-1.45-.19-2.14H12v4.05h5.24a4.48 4.48 0 0 1-1.94 2.94v2.62h3.14c1.84-1.69 2.91-4.19 2.91-7.47Z"
      />

      <path
        fill="currentColor"
        opacity=".8"
        d="M12 21.7c2.62 0 4.82-.87 6.43-2.36l-3.14-2.62c-.87.58-1.98.93-3.29.93-2.53 0-4.67-1.71-5.44-4.01H3.32v2.7A9.71 9.71 0 0 0 12 21.7Z"
      />

      <path
        fill="currentColor"
        opacity=".6"
        d="M6.56 13.64A5.83 5.83 0 0 1 6.25 12c0-.57.1-1.12.31-1.64v-2.7H3.32A9.7 9.7 0 0 0 2.3 12c0 1.56.37 3.04 1.02 4.34l3.24-2.7Z"
      />

      <path
        fill="currentColor"
        opacity=".9"
        d="M12 6.35c1.43 0 2.71.49 3.72 1.45l2.79-2.79A9.35 9.35 0 0 0 12 2.3a9.71 9.71 0 0 0-8.68 5.36l3.24 2.7c.77-2.3 2.91-4.01 5.44-4.01Z"
      />
    </svg>
  );
}