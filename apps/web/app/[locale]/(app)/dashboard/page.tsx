import { getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import { authenticatedApiFetchJson } from "@/lib/api";
import { formatDuration, formatWeight } from "@/lib/result-formatters";
import type { WeightUnit } from "@/lib/result-types";

import TimeAwareGreeting from "./components/TimeAwareGreeting";

type DashboardProfile = {
  displayName: string;
  email: string;
  preferredWeightUnit: "KG" | "LB";
};

type DashboardResultValue =
  | {
      type: "DURATION";
      value: number | null;
    }
  | {
      type: "ROUNDS_REPS";
      rounds: number | null;
      reps: number | null;
    }
  | {
      type: "REPS";
      value: number | null;
    }
  | {
      type: "WEIGHT";
      value: number | null;
      weightUnit: WeightUnit;
      reps?: number | null;
    }
  | {
      type: "DISTANCE";
      value: number | null;
    }
  | {
      type: "CALORIES";
      value: number | null;
    }
  | {
      type: "UNKNOWN";
    };

type DashboardActivity = {
  id: string;
  type: "WORKOUT" | "MOVEMENT";
  performedAt: string;
  href: string;
  title: string;

  subtitle: {
    key: string;
    name: string;
  };

  result: DashboardResultValue;

  badge: {
    key: string;
    name: string;
  } | null;

  prescriptionCategory?: {
    key: string;
    name: string;
  } | null;

  category?: {
    key: string;
    name: string;
  } | null;
};

type DashboardResponse = {
  profile: DashboardProfile;

  currentMonth: {
    workoutResults: number;
    movementResults: number;
    personalRecords: number;
  };

  overall: {
    movementsTracked: number;
  };

  recentActivity: DashboardActivity[];
};

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

async function getDashboard(): Promise<DashboardResponse> {
  return authenticatedApiFetchJson<DashboardResponse>("/users/me/dashboard");
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;

  const [t, workoutTypeT, measurementT, dashboard] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("workoutTypes"),
    getTranslations("measurementTypes"),
    getDashboard(),
  ]);

  const { profile, currentMonth, overall, recentActivity } = dashboard;

  const hasActivity = recentActivity.length > 0;
  const latestActivity = recentActivity[0] ?? null;

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  }

  function getSubtitle(activity: DashboardActivity) {
    const key = activity.subtitle.key.toLowerCase();

    if (activity.type === "WORKOUT") {
      return workoutTypeT.has(key) ? workoutTypeT(key) : activity.subtitle.name;
    }

    return measurementT.has(key) ? measurementT(key) : activity.subtitle.name;
  }

  function formatActivityResult(value: DashboardResultValue) {
    switch (value.type) {
      case "DURATION":
        return value.value !== null ? formatDuration(value.value) : "—";

      case "ROUNDS_REPS":
        return `${value.rounds ?? 0} + ${value.reps ?? 0}`;

      case "REPS":
        return t("activity.repsValue", {
          count: value.value ?? 0,
        });

      case "WEIGHT": {
        const formattedWeight =
          value.value !== null
            ? formatWeight(value.value, value.weightUnit)
            : "—";

        if (value.reps !== undefined && value.reps !== null) {
          return `${value.reps} × ${formattedWeight}`;
        }

        return formattedWeight;
      }

      case "DISTANCE":
        return `${value.value ?? 0} m`;

      case "CALORIES":
        return `${value.value ?? 0} cal`;

      default:
        return "—";
    }
  }

  function getContinueLabel(activity: DashboardActivity) {
    return activity.type === "WORKOUT"
      ? t("trainToday.openWorkout")
      : t("trainToday.openMovement");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t("eyebrow")}
        </p>

        <TimeAwareGreeting name={profile.displayName} />

        <p className="mt-2 text-muted">{t("readyToTrain")}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("stats.workouts")}
          </p>

          <p className="mt-3 text-3xl font-black">
            {currentMonth.workoutResults}
          </p>

          <p className="mt-1 text-xs text-muted">{t("stats.thisMonth")}</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("stats.movementResults")}
          </p>

          <p className="mt-3 text-3xl font-black">
            {currentMonth.movementResults}
          </p>

          <p className="mt-1 text-xs text-muted">{t("stats.thisMonth")}</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("stats.personalRecords")}
          </p>

          <p className="mt-3 text-3xl font-black text-accent">
            {currentMonth.personalRecords}
          </p>

          <p className="mt-1 text-xs text-muted">{t("stats.thisMonth")}</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("stats.movementsTracked")}
          </p>

          <p className="mt-3 text-3xl font-black">{overall.movementsTracked}</p>

          <p className="mt-1 text-xs text-muted">{t("stats.allTime")}</p>
        </Card>
      </section>

      <section>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {t("trainToday.eyebrow")}
          </p>

          <h2 className="mt-2 text-2xl font-bold">{t("trainToday.title")}</h2>

          <p className="mt-2 max-w-2xl text-sm text-muted">
            {t("trainToday.description")}
          </p>
        </div>

        <Card className="mt-5 overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
            <div className="p-6 sm:p-8">
              <h3 className="text-2xl font-black">
                {t("trainToday.readyTitle")}
              </h3>

              <p className="mt-2 max-w-xl text-sm text-muted">
                {t("trainToday.readyDescription")}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/workouts"
                  className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong"
                >
                  {t("trainToday.browseWorkouts")}
                </Link>

                <Link
                  href="/movements"
                  className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition hover:border-accent/40 hover:bg-surface-elevated"
                >
                  {t("trainToday.browseMovements")}
                </Link>
              </div>
            </div>

            <div className="border-t border-border bg-surface-elevated/40 p-6 lg:border-l lg:border-t-0">
              {latestActivity ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    {t("trainToday.continueTraining")}
                  </p>

                  <div className="mt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold">
                          {latestActivity.title}
                        </p>

                        <p className="mt-1 text-sm text-muted">
                          {getSubtitle(latestActivity)}
                        </p>
                      </div>

                      <span className="shrink-0 font-bold text-accent">
                        {formatActivityResult(latestActivity.result)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {latestActivity.badge && (
                        <Badge
                          variant={
                            latestActivity.type === "WORKOUT" &&
                            latestActivity.badge.key === "RX"
                              ? "accent"
                              : undefined
                          }
                        >
                          {latestActivity.badge.name}
                        </Badge>
                      )}

                      {latestActivity.prescriptionCategory && (
                        <Badge>
                          {latestActivity.prescriptionCategory.name}
                        </Badge>
                      )}

                      <span className="text-xs text-muted">
                        {formatDate(latestActivity.performedAt)}
                      </span>
                    </div>

                    <Link
                      href={latestActivity.href}
                      className="mt-5 flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold transition hover:border-accent/40 hover:bg-surface"
                    >
                      <span>{getContinueLabel(latestActivity)}</span>

                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    {t("trainToday.quickLinks")}
                  </p>

                  <div className="mt-4 space-y-3">
                    <Link
                      href="/history"
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:border-accent/40 hover:bg-background"
                    >
                      <span>{t("trainToday.viewHistory")}</span>

                      <span>→</span>
                    </Link>

                    <Link
                      href="/progress"
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:border-accent/40 hover:bg-background"
                    >
                      <span>{t("trainToday.viewProgress")}</span>

                      <span>→</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {t("activity.eyebrow")}
            </p>

            <h2 className="mt-2 text-2xl font-bold">{t("activity.title")}</h2>

            <p className="mt-2 text-sm text-muted">
              {t("activity.description")}
            </p>
          </div>

          {hasActivity && (
            <Link
              href="/history"
              className="text-sm font-semibold text-muted transition hover:text-foreground"
            >
              {t("activity.viewAll")} →
            </Link>
          )}
        </div>

        {!hasActivity ? (
          <Card className="mt-5 p-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-bold text-accent">
              +
            </div>

            <p className="mt-4 font-semibold">{t("activity.emptyTitle")}</p>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              {t("activity.emptyDescription")}
            </p>

            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/workouts"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong"
              >
                {t("trainToday.browseWorkouts")}
              </Link>

              <Link
                href="/movements"
                className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition hover:border-accent/40"
              >
                {t("trainToday.browseMovements")}
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="mt-5 overflow-hidden">
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <Link
                  key={`${activity.type}:${activity.id}`}
                  href={activity.href}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-surface-elevated sm:flex-row sm:items-center"
                >
                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xs font-black",
                      activity.type === "WORKOUT"
                        ? "border-accent/30 bg-accent/10 text-accent"
                        : "border-border bg-surface-elevated text-foreground",
                    ].join(" ")}
                  >
                    {activity.type === "WORKOUT" ? "W" : "M"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{activity.title}</p>

                      {activity.badge && (
                        <Badge
                          variant={
                            activity.type === "WORKOUT" &&
                            activity.badge.key === "RX"
                              ? "accent"
                              : undefined
                          }
                        >
                          {activity.badge.name}
                        </Badge>
                      )}

                      {activity.prescriptionCategory && (
                        <Badge>{activity.prescriptionCategory.name}</Badge>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-muted">
                      {getSubtitle(activity)}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-bold">
                      {formatActivityResult(activity.result)}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {formatDate(activity.performedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
