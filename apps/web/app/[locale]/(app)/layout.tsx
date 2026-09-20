import { Suspense, type ReactNode } from 'react';
import { redirect } from 'next/navigation';

import AppShell from '@/components/layout/AppShell';
import AppStartupScreen from '@/components/layout/AppStartupScreen';
import { authenticatedApiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import type { BoxSummary } from '@/lib/boxes';

type Props = {
  children: ReactNode;

  params: Promise<{
    locale: string;
  }>;
};

async function loadAppBootstrap() {
  const startedAt = performance.now();
  const result = await Promise.all([
    getCurrentUser(),
    authenticatedApiFetch('/boxes'),
  ]);
  const durationMs = Math.round(performance.now() - startedAt);

  if (durationMs >= 1_500) {
    console.info(`[app-startup] Auth and box bootstrap took ${durationMs}ms`);
  }

  return result;
}

export default function AuthenticatedLayout({
  children,
  params,
}: Props) {
  return (
    <Suspense fallback={<AppStartupScreen />}>
      <AuthenticatedApp params={params}>{children}</AuthenticatedApp>
    </Suspense>
  );
}

async function AuthenticatedApp({ children, params }: Props) {
  const { locale } = await params;
  const [user, boxesResponse] = await loadAppBootstrap();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const boxes = boxesResponse?.ok
    ? ((await boxesResponse.json()) as BoxSummary[])
    : [];

  return (
    <AppShell user={user} initialBoxes={boxes}>
      {children}
    </AppShell>
  );
}
