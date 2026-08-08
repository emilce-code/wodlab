import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LogoutButton } from './logout-button';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <LogoutButton />
      </div>

      <p className="mt-6">
        Welcome, {user.athleteProfile?.displayName ?? user.email}
      </p>
      
      <Link
        href="/movements"
        className="mt-6 inline-block rounded border px-4 py-2"
      >
        Movement Library
      </Link>

      <Link
        href="/workouts"
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Workout Library
      </Link>

      <div className="mt-6 space-y-2">
        <p>Email: {user.email}</p>

        <p>
          Preferred weight unit:{' '}
          {user.athleteProfile?.preferredWeightUnit ?? 'Not set'}
        </p>
      </div>
    </main>
  );
}