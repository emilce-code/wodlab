import { getTranslations } from "next-intl/server";

import LogoutButton from "@/components/auth/LogoutButton";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";
import ButtonLink from "@/components/ui/ButtonLink";
import { Link } from "@/i18n/navigation";

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

type DashboardSummary = {
  currentMonth: {
    workoutResults: number;
    movementResults: number;
    personalRecords: number;
  };
  overall: { movementsTracked: number };
};

type ConsistencySummary = {
  consistency: { totalSessions: { current: number }; currentStreak: number };
};

type BoxSummary = { id: string; name: string; role: string; isActive: boolean };

type CoachWorkspace = {
  activeBox: { id: string; name: string } | null;
  coaches: Array<{ id: string; coachProfile: { displayName: string } }>;
  receivedInvitations: Array<{
    id: string;
    coachProfile: { displayName: string };
  }>;
};

async function getWorkoutLevels(): Promise<WorkoutLevel[]> {
  return authenticatedApiFetchJson<WorkoutLevel[]>("/workouts/levels");
}

async function getPrescriptionCategories(): Promise<PrescriptionCategory[]> {
  return authenticatedApiFetchJson<PrescriptionCategory[]>(
    "/workouts/prescription-categories",
  );
}

async function getDashboard() {
  return authenticatedApiFetchJson<DashboardSummary>("/users/me/dashboard");
}

async function getConsistency() {
  return authenticatedApiFetchJson<ConsistencySummary>(
    "/users/me/insights/consistency?period=30D",
  );
}

async function getBoxes() {
  return authenticatedApiFetchJson<BoxSummary[]>("/boxes");
}

async function getCoachWorkspace() {
  return authenticatedApiFetchJson<CoachWorkspace>("/coach/workspace");
}

export default async function AccountPage() {
  const t = await getTranslations("account");

  const [user, preferenceResults, overviewResults] = await Promise.all([
    getCurrentUser(),
    Promise.allSettled([getWorkoutLevels(), getPrescriptionCategories()]),
    Promise.allSettled([
      getDashboard(),
      getConsistency(),
      getBoxes(),
      getCoachWorkspace(),
    ]),
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
  const [dashboardResult, consistencyResult, boxesResult, coachResult] =
    overviewResults;
  const dashboard =
    dashboardResult.status === "fulfilled" ? dashboardResult.value : null;
  const consistency =
    consistencyResult.status === "fulfilled" ? consistencyResult.value : null;
  const boxes = boxesResult.status === "fulfilled" ? boxesResult.value : [];
  const coachWorkspace =
    coachResult.status === "fulfilled" ? coachResult.value : null;
  const activeBox = boxes.find((box) => box.isActive) ?? null;
  const completedFields = [
    Boolean(user.athleteProfile?.displayName),
    Boolean(user.athleteProfile?.preferredWorkoutLevel),
    Boolean(user.athleteProfile?.preferredPrescriptionCategory),
    Boolean(user.athleteProfile?.weeklyTrainingTarget),
    Boolean(user.athleteProfile?.trainingGoals.length),
  ].filter(Boolean).length;
  const completionPercentage = completedFields * 20;

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <Card className="mt-6 p-4 sm:mt-8 sm:p-6">
        <div className="flex items-center gap-4">
          <div
            role={user.athleteProfile?.avatarUrl ? "img" : undefined}
            aria-label={
              user.athleteProfile?.avatarUrl
                ? t("profile.avatarAlt", { name: displayName })
                : undefined
            }
            style={
              user.athleteProfile?.avatarUrl
                ? { backgroundImage: `url(${user.athleteProfile.avatarUrl})` }
                : undefined
            }
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-accent bg-cover bg-center text-lg font-black text-accent"
          >
            {user.athleteProfile?.avatarUrl ? (
              <span className="sr-only">{initials}</span>
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{displayName}</p>

            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>
      </Card>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [
            t("overview.sessions"),
            consistency?.consistency.totalSessions.current ??
              dashboard?.currentMonth.workoutResults ??
              0,
          ],
          [t("overview.streak"), consistency?.consistency.currentStreak ?? 0],
          [t("overview.prs"), dashboard?.currentMonth.personalRecords ?? 0],
          [t("overview.movements"), dashboard?.overall.movementsTracked ?? 0],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <p className="text-2xl font-black text-accent">{value}</p>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </Card>
        ))}
      </section>

      <Card className="mt-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold">{t("completion.title")}</p>
            <p className="mt-1 text-xs text-muted">
              {t("completion.description")}
            </p>
          </div>
          <span className="text-sm font-black text-accent">
            {completionPercentage}%
          </span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-surface-elevated"
          role="progressbar"
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("completion.title")}
        >
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </Card>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("connections.title")}
          </p>
          <p className="mt-2 font-bold">
            {activeBox?.name ?? t("connections.noBox")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {coachWorkspace?.coaches[0]?.coachProfile.displayName
              ? t("connections.coach", {
                  name: coachWorkspace.coaches[0].coachProfile.displayName,
                })
              : coachWorkspace?.receivedInvitations.length
                ? t("connections.pendingInvite")
                : t("connections.noCoach")}
          </p>
          <Link
            href="/classes"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent"
          >
            {t("connections.manage")}
          </Link>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("quickActions.title")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ButtonLink href="/workouts" size="sm">
              {t("quickActions.log")}
            </ButtonLink>
            <ButtonLink href="/progress" size="sm" variant="secondary">
              {t("quickActions.progress")}
            </ButtonLink>
            <ButtonLink href="/movements" size="sm" variant="secondary">
              {t("quickActions.maxes")}
            </ButtonLink>
            <ButtonLink href="/history" size="sm" variant="secondary">
              {t("quickActions.history")}
            </ButtonLink>
          </div>
        </Card>
      </section>

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

            leaderboardEnabled:
              user.athleteProfile?.leaderboardEnabled ?? false,

            preferredWeightUnit:
              user.athleteProfile?.preferredWeightUnit ?? "KG",

            preferredWorkoutLevelKey:
              user.athleteProfile?.preferredWorkoutLevel?.key ?? "",

            preferredPrescriptionCategoryKey:
              user.athleteProfile?.preferredPrescriptionCategory?.key ?? "",
            avatarUrl: user.athleteProfile?.avatarUrl ?? "",
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

      <section className="mt-6">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {t("preferences.eyebrow")}
          </p>

          <h2 className="mt-1 text-xl font-bold">{t("preferences.title")}</h2>
        </div>

        <Card className="p-4 sm:p-6">
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

      <Card className="mt-6 p-4 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {t("session.eyebrow")}
        </p>

        <h2 className="mt-2 text-lg font-bold">{t("session.title")}</h2>

        <p className="mt-2 text-sm text-muted">{t("session.description")}</p>

        <div className="mt-5">
          <LogoutButton className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            {t("session.logout")}
          </LogoutButton>
        </div>
      </Card>
    </div>
  );
}
