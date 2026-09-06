import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { auth0 } from './lib/auth0';
import { routing } from './i18n/routing';

const intlMiddleware =
  createMiddleware(routing);

export async function proxy(
  request: NextRequest,
) {
  const authResponse =
    await auth0.middleware(
      request,
    );

  if (
    request.nextUrl.pathname.startsWith(
      '/auth/',
    ) ||
    request.nextUrl.pathname.startsWith(
      '/api/',
    )
  ) {
    return authResponse;
  }

  const intlResponse =
    intlMiddleware(request);

  for (const cookie of
    authResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};