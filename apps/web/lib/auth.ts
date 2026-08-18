import {
  authenticatedApiFetch,
} from './api';

import { auth0 } from './auth0';

export type CurrentUser = {
  id: string;
  email: string;

  athleteProfile: {
    id: string;
    displayName: string;
    preferredWeightUnit:
      | 'KG'
      | 'LB';
  } | null;

  createdAt: string;
  updatedAt: string;
};

async function fetchCurrentUser(): Promise<
  Response | null
> {
  return authenticatedApiFetch(
    '/me',
  );
}

async function provisionCurrentUser() {
  const session =
    await auth0.getSession();

  if (!session) {
    return null;
  }

  const email =
    session.user.email;

  if (
    typeof email !==
      'string' ||
    !email
  ) {
    return null;
  }

  const displayName =
    typeof session.user.name ===
      'string' &&
    session.user.name.trim()
      ? session.user.name.trim()
      : email.split('@')[0];

  return authenticatedApiFetch(
    '/users/provision',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        email,
        displayName,
      }),
    },
  );
}

export async function getCurrentUser(): Promise<
  CurrentUser | null
> {
  try {
    let response =
      await fetchCurrentUser();

    if (
      response?.status === 401
    ) {
      const provisionResponse =
        await provisionCurrentUser();

      if (
        !provisionResponse?.ok
      ) {
        return null;
      }

      response =
        await fetchCurrentUser();
    }

    if (!response?.ok) {
      return null;
    }

    return (
      await response.json()
    ) as CurrentUser;
  } catch {
    return null;
  }
}