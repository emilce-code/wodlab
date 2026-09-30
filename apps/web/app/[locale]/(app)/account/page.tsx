import { getTranslations } from "next-intl/server";

import LogoutButton from "@/components/auth/LogoutButton";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";

import { authenticatedApiFetchJson } from "@/lib/api";

import { getCurrentUser } from "@/lib/auth";

import AthleteProfileForm from "./components/AthleteProfileForm";

type WorkoutLevel = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

type PrescriptionCategory = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

async function getWorkoutLevels(): Promise<WorkoutLevel[]> {
  return authenticatedApiFetchJson<WorkoutLevel[]>("/workouts/levels");
}

async function getPrescriptionCategories(): Promise<PrescriptionCategory[]> {
  return authenticatedApiFetchJson<PrescriptionCategory[]>(
    "/workouts/prescription-categories",
  );
}

export default async function AccountPage() {
  const t = await getTranslations("account");

  const [user, preferenceResults] = await Promise.all([
    getCurrentUser(),
    Promise.allSettled([getWorkoutLevels(), getPrescriptionCategories()]),
  ]);

  if (!user) {
    throw new Error("Unable to load the current user");
  }

  const [workoutLevelsResult, prescriptionCategoriesResult] = preferenceResults;

  const workoutLevelsFailed = workoutLevelsResult.status === "rejected";
  const prescriptionCategoriesFailed =
    prescriptionCategoriesResult.status === "rejected";

  const workoutLevels = workoutLevelsFailed ? [] : workoutLevelsResult.value;
  const prescriptionCategories = prescriptionCategoriesFailed
    ? []
    : prescriptionCategoriesResult.value;

  return (
    <div className="mx-auto max-w-3xl pb-28 sm:pb-0">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      {(workoutLevelsFailed || prescriptionCategoriesFailed) && (
        <Alert className="mt-6">{t("profile.preferencesUnavailable")}</Alert>
      )}

      <section className="mt-6 sm:mt-8">
        <AthleteProfileForm
          email={user.email}
          profile={{
            displayName: user.athleteProfile?.displayName ?? "",

            leaderboardEnabled:
              user.athleteProfile?.leaderboardEnabled ?? false,

            preferredWeightUnit:
              user.athleteProfile?.preferredWeightUnit ?? "KG",

            preferredWorkoutLevelKey:
              user.athleteProfile?.preferredWorkoutLevel?.key ?? "",

            preferredPrescriptionCategoryKey:
              user.athleteProfile?.preferredPrescriptionCategory?.key ?? "",
            avatarPath: user.athleteProfile?.avatarPath ?? "",
            bio: user.athleteProfile?.bio ?? "",
            trainingGoals: user.athleteProfile?.trainingGoals ?? [],
            weeklyTrainingTarget:
              user.athleteProfile?.weeklyTrainingTarget ?? null,
            loadRoundingIncrement:
              user.athleteProfile?.loadRoundingIncrement ?? null,
          }}
          workoutLevels={workoutLevels}
          prescriptionCategories={prescriptionCategories}
        />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold">{t("language.title")}</p>

              <p className="mt-1 text-sm text-muted">
                {t("language.description")}
              </p>
            </div>

            <div className="w-full sm:w-40">
              <LanguageSwitcher />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-bold">{t("session.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("session.description")}</p>
          <LogoutButton className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50">
            {t("session.logout")}
          </LogoutButton>
        </Card>
      </section>
    </div>
  );
}
