import { cookies } from 'next/headers';

export async function authenticatedApiFetch(
  path: string,
  init?: RequestInit,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('wodlab_access_token')?.value;

  if (!token) {
    return null;
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error('API_URL is not configured');
  }

  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
}