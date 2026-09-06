'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export default function LogoutButton({
  className = '',
  children = 'Log out',
}: Props) {
  const locale = useLocale();

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);

  function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    const returnTo = new URL(
      `/${locale}/login`,
      window.location.origin,
    );

    const logoutUrl = new URL(
      '/auth/logout',
      window.location.origin,
    );

    logoutUrl.searchParams.set(
      'returnTo',
      returnTo.toString(),
    );

    window.location.assign(
      logoutUrl.toString(),
    );
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