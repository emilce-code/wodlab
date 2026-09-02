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

  const displayName = user.athleteProfile?.displayName ?? user.email;

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <Card className="mt-8 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-accent text-lg font-black text-accent">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{displayName}</p>

            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>
      </Card>

      {(workoutLevelsFailed || prescriptionCategoriesFailed) && (
        <Alert className="mt-6">{t("profile.preferencesUnavailable")}</Alert>
      )}

      <section className="mt-6">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {t("profile.eyebrow")}
          </p>

          <h2 className="mt-1 text-xl font-bold">{t("profile.title")}</h2>

          <p className="mt-1 text-sm text-muted">{t("profile.description")}</p>
        </div>

        <AthleteProfileForm
          email={user.email}
          profile={{
            displayName: user.athleteProfile?.displayName ?? "",

            preferredWeightUnit:
              user.athleteProfile?.preferredWeightUnit ?? "KG",

            preferredWorkoutLevelKey:
              user.athleteProfile?.preferredWorkoutLevel?.key ?? "",

            preferredPrescriptionCategoryKey:
              user.athleteProfile?.preferredPrescriptionCategory?.key ?? "",
          }}
          workoutLevels={workoutLevels}
          prescriptionCategories={prescriptionCategories}
        />
      </section>

      <section className="mt-6">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {t("preferences.eyebrow")}
          </p>

          <h2 className="mt-1 text-xl font-bold">{t("preferences.title")}</h2>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{t("language.title")}</p>

              <p className="mt-1 text-sm text-muted">
                {t("language.description")}
              </p>
            </div>

            <div className="w-full sm:w-40">
              <LanguageSwitcher />
            </div>
          </div>
        </Card>
      </section>

      <Card className="mt-6 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {t("session.eyebrow")}
        </p>

        <h2 className="mt-2 text-lg font-bold">{t("session.title")}</h2>

        <p className="mt-2 text-sm text-muted">{t("session.description")}</p>

        <div className="mt-5">
          <LogoutButton className="inline-flex items-center justify-center rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50">
            {t("session.logout")}
          </LogoutButton>
        </div>
      </Card>
    </div>
  );
}
