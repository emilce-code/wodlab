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

export default function MobileNavigation() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }

    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-4">
        {navigation.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex min-h-16 flex-col items-center justify-center gap-1',
                'text-[11px] font-medium transition-colors',
                active
                  ? 'text-accent'
                  : 'text-muted',
              ].join(' ')}
            >
              <span className="text-lg">
                {item.icon}
              </span>

              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}