import { authenticatedApiFetch } from './api';

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
  try {
    const response = await authenticatedApiFetch('/me');

    if (!response?.ok) {
      return null;
    }

    return (await response.json()) as CurrentUser;
  } catch {
    return null;
  }
}