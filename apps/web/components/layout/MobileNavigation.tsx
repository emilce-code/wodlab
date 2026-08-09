'use client';

import { useTranslations } from 'next-intl';

import {
  Link,
  usePathname,
} from '@/i18n/navigation';

const navigation = [
  {
    key: 'today',
    href: '/dashboard',
    icon: '⌂',
  },
  {
    key: 'workouts',
    href: '/workouts',
    icon: '◫',
  },
  {
    key: 'progress',
    href: '/progress',
    icon: '↗',
  },
  {
    key: 'account',
    href: '/account',
    icon: '○',
  },
] as const;

export default function MobileNavigation() {
  const t =
    useTranslations(
      'navigation',
    );

  const pathname =
    usePathname();

  function isActive(
    href: string,
  ) {
    if (
      href === '/dashboard'
    ) {
      return (
        pathname === '/dashboard'
      );
    }

    return pathname.startsWith(
      href,
    );
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-4">
        {navigation.map(
          (item) => {
            const active =
              isActive(
                item.href,
              );

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

                {t(item.key)}
              </Link>
            );
          },
        )}
      </div>
    </nav>
  );
}