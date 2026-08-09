'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    name: 'Today',
    href: '/dashboard',
    icon: '⌂',
  },
  {
    name: 'Workouts',
    href: '/workouts',
    icon: '◫',
  },
  {
    name: 'History',
    href: '/history',
    icon: '↶',
  },
  {
    name: 'Progress',
    href: '/progress',
    icon: '↗',
  },
];

const secondaryNavigation = [
  {
    name: 'Movements',
    href: '/movements',
    icon: '⊞',
  },
];

type Props = {
  user: {
    email: string;
    athleteProfile?: {
      displayName?: string | null;
    } | null;
  };
};

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();

  const displayName =
    user.athleteProfile?.displayName ?? user.email;

  function isActive(href: string) {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }

    return pathname.startsWith(href);
  }

  function renderNavigationItem(item: {
    name: string;
    href: string;
    icon: string;
  }) {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={[
          'flex items-center gap-3 rounded-lg px-3 py-2.5',
          'text-sm font-medium transition-colors',
          active
            ? 'bg-accent/10 text-accent'
            : 'text-muted hover:bg-surface-elevated hover:text-foreground',
        ].join(' ')}
      >
        <span className="w-5 text-center text-base">
          {item.icon}
        </span>

        {item.name}
      </Link>
    );
  }

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
      <div className="px-6 py-7">
        <Link
          href="/dashboard"
          className="text-xl font-black tracking-tight"
        >
          WOD<span className="text-accent">LAB</span>
        </Link>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {navigation.map(renderNavigationItem)}
        </div>

        <div className="my-5 border-t border-border" />

        <div className="space-y-1">
          {secondaryNavigation.map(renderNavigationItem)}
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-surface-elevated"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent text-xs font-bold text-accent">
            {displayName
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {displayName}
            </p>

            <p className="truncate text-xs text-muted">
              View profile
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
}