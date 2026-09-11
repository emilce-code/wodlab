import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";
import ButtonLink from "@/components/ui/ButtonLink";
import { authenticatedApiFetchJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import type { PaginatedResponse } from "@/lib/pagination";

import WorkoutLibrary from "./components/WorkoutLibrary";
import type { Workout } from "./components/WorkoutCard";

async function getWorkouts(): Promise<PaginatedResponse<Workout>> {
  return authenticatedApiFetchJson<PaginatedResponse<Workout>>(
    "/workouts?page=1&pageSize=12",
  );
}

async function getArchivedWorkouts(): Promise<PaginatedResponse<Workout>> {
  return authenticatedApiFetchJson<PaginatedResponse<Workout>>(
    "/workouts/archived?page=1&pageSize=12",
  );
}

export default async function WorkoutsPage() {
  const t = await getTranslations("workouts.library");

  const [workouts, archivedWorkouts, currentUser] = await Promise.all([
    getWorkouts(),
    getArchivedWorkouts(),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        action={
          <ButtonLink href="/workouts/new">+ {t("createWorkout")}</ButtonLink>
        }
      />

      <WorkoutLibrary
        workouts={workouts}
        archivedWorkouts={archivedWorkouts}
        preferredWorkoutLevelKey={
          currentUser?.athleteProfile?.preferredWorkoutLevel?.key ?? null
        }
      />
    </div>
  );
}
