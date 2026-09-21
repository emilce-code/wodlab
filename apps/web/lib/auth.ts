import { authenticatedApiFetch } from "./api";

import { auth0 } from "./auth0";
import { redirect, unstable_rethrow } from "next/navigation";

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
    avatarUrl: string | null;
    bio: string | null;
    trainingGoals: Array<
      | "GENERAL_FITNESS"
      | "STRENGTH"
      | "CONDITIONING"
      | "GYMNASTICS"
      | "WEIGHTLIFTING"
      | "COMPETITION"
    >;
    weeklyTrainingTarget: number | null;
    loadRoundingIncrement: number | null;

    preferredWorkoutLevel: AthletePreference | null;

    preferredPrescriptionCategory: AthletePreference | null;
  } | null;

  createdAt: string;
  updatedAt: string;
};

export type CurrentUserResolution =
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated" }
  | { status: "unavailable" };

export class CurrentUserUnavailableError extends Error {
  constructor() {
    super("Unable to complete WODLY authentication");
    this.name = "CurrentUserUnavailableError";
  }
}

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

async function provisionCurrentUser(
  session: NonNullable<Awaited<ReturnType<typeof auth0.getSession>>>,
) {
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
  const resolution = await resolveCurrentUser();

  if (resolution.status === "authenticated") return resolution.user;
  if (resolution.status === "unauthenticated") return null;

  throw new CurrentUserUnavailableError();
}

export async function resolveCurrentUser(): Promise<CurrentUserResolution> {
  try {
    const session = await auth0.getSession();

    if (!session) return { status: "unauthenticated" };

    let response = await fetchCurrentUser();

    if (response?.status === 401) {
      const provisionResponse = await provisionCurrentUser(session);

      if (!provisionResponse?.ok) {
        console.error(
          `[auth] WODLY user provisioning failed (${provisionResponse?.status ?? "no response"})`,
        );
        return { status: "unavailable" };
      }

      response = await fetchCurrentUser();
    }

    if (!response?.ok) {
      console.error(
        `[auth] Current user lookup failed (${response?.status ?? "no response"})`,
      );
      return { status: "unavailable" };
    }

    return {
      status: "authenticated",
      user: (await response.json()) as CurrentUser,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error(
      "[auth] Authentication completion failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
