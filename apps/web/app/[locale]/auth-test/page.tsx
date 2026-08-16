import { auth0 } from '@/lib/auth0';

type ProvisionedUser = {
  id: string;
  auth0UserId: string;
  email: string;
  athleteProfile: {
    id: string;
    userId: string;
    displayName: string;
    preferredWeightUnit: 'KG' | 'LB';
  } | null;
};

export default async function AuthTestPage() {
  const session =
    await auth0.getSession();

  if (!session) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Not authenticated
        </h1>

        <a
          href="/auth/login?audience=https%3A%2F%2Fapi.wodly.app&returnTo=%2Fen%2Fauth-test"
          className="mt-4 inline-block underline"
        >
          Continue with Google
        </a>
      </main>
    );
  }

  let accessTokenAvailable =
    false;

  let tokenValidationAccepted =
    false;

  let provisionedUser:
    | ProvisionedUser
    | null = null;

  let error:
    | string
    | null = null;

  try {
    const tokenResponse =
      await auth0.getAccessToken();

    accessTokenAvailable =
      Boolean(
        tokenResponse.token,
      );

    const token =
      tokenResponse.token;

    if (!token) {
      throw new Error(
        'Auth0 access token is unavailable',
      );
    }

    const apiUrl =
      process.env.API_URL;

    if (!apiUrl) {
      throw new Error(
        'API_URL is not configured',
      );
    }

    const validationResponse =
      await fetch(
        `${apiUrl}/auth0-test`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          cache: 'no-store',
        },
      );

    tokenValidationAccepted =
      validationResponse.ok;

    if (!validationResponse.ok) {
      const body =
        await validationResponse.json();

      throw new Error(
        body.message ??
          'NestJS rejected the Auth0 token',
      );
    }

    const email =
      session.user.email;

    if (
      typeof email !== 'string' ||
      !email
    ) {
      throw new Error(
        'Auth0 session does not contain an email',
      );
    }

    const displayName =
      typeof session.user.name ===
        'string' &&
      session.user.name.trim()
        ? session.user.name
        : email;

    const provisionResponse =
      await fetch(
        `${apiUrl}/auth/provision`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            email,
            displayName,
          }),

          cache: 'no-store',
        },
      );

    const body =
      await provisionResponse.json();

    if (!provisionResponse.ok) {
      throw new Error(
        body.message ??
          'Unable to provision WODLY user',
      );
    }

    provisionedUser =
      body as ProvisionedUser;
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : 'Unable to test Auth0 provisioning';
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        Auth0 integration test
      </h1>

      <div className="mt-6 space-y-2">
        <p>
          <strong>Name:</strong>{' '}
          {session.user.name}
        </p>

        <p>
          <strong>Email:</strong>{' '}
          {session.user.email}
        </p>

        <p>
          <strong>
            Auth0 ID:
          </strong>{' '}
          {session.user.sub}
        </p>

        <p>
          <strong>
            WODLY API access token:
          </strong>{' '}
          {accessTokenAvailable
            ? 'Available'
            : 'Not available'}
        </p>

        <p>
          <strong>
            NestJS token validation:
          </strong>{' '}
          {tokenValidationAccepted
            ? 'Accepted'
            : 'Not accepted'}
        </p>

        <p>
          <strong>
            WODLY user provisioning:
          </strong>{' '}
          {provisionedUser
            ? 'Success'
            : 'Not completed'}
        </p>

        {provisionedUser && (
          <>
            <p>
              <strong>
                WODLY User ID:
              </strong>{' '}
              {provisionedUser.id}
            </p>

            <p>
              <strong>
                Auth0 User ID:
              </strong>{' '}
              {
                provisionedUser.auth0UserId
              }
            </p>

            <p>
              <strong>
                Profile:
              </strong>{' '}
              {
                provisionedUser
                  .athleteProfile
                  ?.displayName
              }
            </p>

            <p>
              <strong>
                Weight unit:
              </strong>{' '}
              {
                provisionedUser
                  .athleteProfile
                  ?.preferredWeightUnit
              }
            </p>
          </>
        )}

        {error && (
          <p className="text-red-500">
            <strong>
              Error:
            </strong>{' '}
            {error}
          </p>
        )}
      </div>

      <a
        href="/auth/logout"
        className="mt-6 inline-block underline"
      >
        Log out
      </a>
    </main>
  );
}