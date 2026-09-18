import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import AppShell from '@/components/layout/AppShell';
import { authenticatedApiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import type { BoxSummary } from '@/lib/boxes';

type Props = {
  children: ReactNode;

  params: Promise<{
    locale: string;
  }>;
};

export default async function AuthenticatedLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;

  const user =
    await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const boxesResponse = await authenticatedApiFetch('/boxes');
  const boxes = boxesResponse?.ok
    ? ((await boxesResponse.json()) as BoxSummary[])
    : [];

  return (
    <AppShell user={user} initialBoxes={boxes}>
      {children}
    </AppShell>
  );
}
