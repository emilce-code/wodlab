import type { ReactNode } from 'react';
import MobileNavigation from './MobileNavigation';
import Sidebar from './Sidebar';

type Props = {
  children: ReactNode;

  user: {
    email: string;
    athleteProfile?: {
      displayName?: string | null;
    } | null;
  };
};

export default function AppShell({
  children,
  user,
}: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar user={user} />

        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-5 py-6 pb-24 sm:px-8 lg:px-10 lg:py-8 lg:pb-8">
            {children}
          </div>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}