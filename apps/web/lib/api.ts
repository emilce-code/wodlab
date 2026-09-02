import { auth0 } from "./auth0";

export async function authenticatedApiFetch(path: string, init?: RequestInit) {
  const session = await auth0.getSession();

  if (!session) {
    return null;
  }

  let token: string;

  try {
    const tokenResponse = await auth0.getAccessToken();

    token = tokenResponse.token;
  } catch {
    return null;
  }

  if (!token) {
    return null;
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("API_URL is not configured");
  }

  return fetch(`${apiUrl}${path}`, {
    ...init,

    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },

    cache: "no-store",
  });
}

export async function authenticatedApiFetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await authenticatedApiFetch(path, init);

  if (!response) {
    throw new Error(`Unable to authenticate API request: ${path}`);
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${path} (${response.status})`);
  }

  return (await response.json()) as T;
}
