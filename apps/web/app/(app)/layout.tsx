import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import AppShell from '@/components/layout/AppShell';
import { getCurrentUser } from '@/lib/auth';

type Props = {
  children: ReactNode;
};

export default async function AuthenticatedLayout({
  children,
}: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  );
}