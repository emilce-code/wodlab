import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";
import ButtonLink from "@/components/ui/ButtonLink";
import { authenticatedApiFetchJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

import WorkoutLibrary from "./components/WorkoutLibrary";
import type { Workout } from "./components/WorkoutCard";

async function getWorkouts(): Promise<Workout[]> {
  return authenticatedApiFetchJson<Workout[]>("/workouts");
}

async function getArchivedWorkouts(): Promise<Workout[]> {
  return authenticatedApiFetchJson<Workout[]>("/workouts/archived");
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
        currentUserId={currentUser?.id ?? null}
        preferredWorkoutLevelKey={
          currentUser?.athleteProfile?.preferredWorkoutLevel?.key ?? null
        }
      />
    </div>
  );
}
