'use client';

import { useState } from 'react';

import {
  useRouter,
} from '@/i18n/navigation';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export default function LogoutButton({
  className = '',
  children = 'Log out',
}: Props) {
  const router =
    useRouter();

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response =
        await fetch(
          '/api/auth/logout',
          {
            method: 'POST',
          },
        );

      if (!response.ok) {
        throw new Error(
          'Unable to log out',
        );
      }

      router.replace(
        '/login',
      );

      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
    >
      {isLoggingOut
        ? 'Logging out...'
        : children}
    </button>
  );
}