import { Auth0Client } from '@auth0/nextjs-auth0/server';

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email',
  },
  session: {
    rolling: true,
    inactivityDuration: SEVEN_DAYS_IN_SECONDS,
    absoluteDuration: SEVEN_DAYS_IN_SECONDS,
  },
});
