import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { auth0 } from './lib/auth0';
import { routing } from './i18n/routing';

const intlMiddleware =
  createMiddleware(routing);

export async function proxy(
  request: NextRequest,
) {
  // Auth0 needs to handle its own /auth/* routes,
  // including login, callback and logout.
  if (
    request.nextUrl.pathname.startsWith(
      '/auth/',
    )
  ) {
    return auth0.middleware(request);
  }

  // All other application routes continue
  // through next-intl.
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};