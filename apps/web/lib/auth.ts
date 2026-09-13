import { authenticatedApiFetch } from "./api";

import { auth0 } from "./auth0";
import { redirect } from "next/navigation";

export type UserRole = "USER" | "COACH" | "ADMIN";

type AthletePreference = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
};

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  permissions: string[];

  athleteProfile: {
    id: string;
    displayName: string;
    leaderboardEnabled: boolean;
    preferredWeightUnit: "KG" | "LB";

    preferredWorkoutLevel: AthletePreference | null;

    preferredPrescriptionCategory: AthletePreference | null;
  } | null;

  createdAt: string;
  updatedAt: string;
};

async function fetchCurrentUser(): Promise<Response | null> {
  return authenticatedApiFetch("/me");
}

export function hasRole(user: CurrentUser, roles: readonly UserRole[]) {
  return roles.includes(user.role);
}

export async function requireRole(locale: string, roles: readonly UserRole[]) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!hasRole(user, roles)) redirect(`/${locale}/dashboard`);
  return user;
}

async function provisionCurrentUser() {
  const session = await auth0.getSession();

  if (!session) {
    return null;
  }

  const email = session.user.email;

  if (typeof email !== "string" || !email) {
    return null;
  }

  const displayName =
    typeof session.user.name === "string" && session.user.name.trim()
      ? session.user.name.trim()
      : email.split("@")[0];

  return authenticatedApiFetch("/auth/provision", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email,
      displayName,
    }),
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    let response = await fetchCurrentUser();

    if (response?.status === 401) {
      const provisionResponse = await provisionCurrentUser();

      if (!provisionResponse?.ok) {
        return null;
      }

      response = await fetchCurrentUser();
    }

    if (!response?.ok) {
      return null;
    }

    return (await response.json()) as CurrentUser;
  } catch {
    return null;
  }
}
