import { cookies } from 'next/headers';

export type CurrentUser = {
  id: string;
  email: string;
  athleteProfile: {
    id: string;
    displayName: string;
    preferredWeightUnit: 'KG' | 'LB';
  } | null;
  createdAt: string;
  updatedAt: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('wodlab_access_token')?.value;

  if (!token) {
    return null;
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error('API_URL is not configured');
  }

  try {
    const response = await fetch(`${apiUrl}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CurrentUser;
  } catch {
    return null;
  }
}