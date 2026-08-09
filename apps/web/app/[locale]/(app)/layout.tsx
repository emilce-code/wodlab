import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import AppShell from '@/components/layout/AppShell';
import { getCurrentUser } from '@/lib/auth';

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

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  );
}