import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { authenticatedApiFetchJson } from "@/lib/api";

import WorkoutLibrary from "./components/WorkoutLibrary";
import type { Workout } from "./components/WorkoutCard";

async function getWorkouts(): Promise<Workout[]> {
  return authenticatedApiFetchJson<Workout[]>("/workouts");
}

export default async function WorkoutsPage() {
  const t = await getTranslations("workouts.library");

  const workouts = await getWorkouts();

  return (
    <div>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            {t("eyebrow")}
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {t("title")}
          </h1>

          <p className="mt-2 max-w-xl text-muted">{t("description")}</p>
        </div>

        <Link
          href="/workouts/new"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong"
        >
          + {t("createWorkout")}
        </Link>
      </header>

      <WorkoutLibrary workouts={workouts} />
    </div>
  );
}
