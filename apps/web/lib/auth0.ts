import { Auth0Client } from '@auth0/nextjs-auth0/server';

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email',
  },
  session: {
    rolling: true,
    inactivityDuration: THIRTY_DAYS_IN_SECONDS,
    absoluteDuration: THIRTY_DAYS_IN_SECONDS,
  },
});
