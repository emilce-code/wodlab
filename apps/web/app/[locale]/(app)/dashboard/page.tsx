import { getTranslations } from "next-intl/server";
import Image from "next/image";

import Badge from "@/components/ui/Badge";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import { authenticatedApiFetchJson } from "@/lib/api";
import { formatShortDate } from "@/lib/date-formatters";
import { formatDuration, formatWeight } from "@/lib/result-formatters";
import type { WeightUnit } from "@/lib/result-types";
import type { BoxSummary } from "@/lib/boxes";

import TimeAwareGreeting from "./components/TimeAwareGreeting";
import TodaySchedule from "./components/TodaySchedule";
import GettingStartedChecklist from "./components/GettingStartedChecklist";

type DashboardProfile = {
  id: string;
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

  onboarding: {
    profileCompleted: boolean;
    preferencesConfigured: boolean;
    hasMovementResult: boolean;
    hasWorkoutResult: boolean;
    hasScheduledWorkout: boolean;
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

  const [t, workoutTypeT, measurementT, dashboard, boxes, boxT] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("workoutTypes"),
    getTranslations("measurementTypes"),
    getDashboard(),
    authenticatedApiFetchJson<BoxSummary[]>("/boxes"),
    getTranslations("boxContext"),
  ]);

  const { profile, currentMonth, overall, onboarding, recentActivity } =
    dashboard;

  const hasActivity = recentActivity.length > 0;
  const activeBox = boxes.find((box) => box.isActive) ?? boxes[0] ?? null;

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

  return (
    <div className="mx-auto max-w-5xl space-y-8 sm:space-y-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t("eyebrow")}
        </p>

        <TimeAwareGreeting name={profile.displayName} />

        <p className="mt-2 text-muted">{t("readyToTrain")}</p>
      </header>

      {activeBox ? (
        <Link
          href="/classes"
          className="group overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition hover:border-accent/30"
        >
          <div className="relative h-24 bg-gradient-to-br from-surface-elevated to-background sm:h-28">
            {activeBox.coverImageUrl ? (
              <Image src={activeBox.coverImageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 1024px" className="object-cover opacity-60 transition group-hover:opacity-70" unoptimized />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(163,255,18,0.15),transparent_55%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
          </div>
          <div className="-mt-6 relative flex items-end gap-3 px-4 pb-4 sm:px-5">
            {activeBox.logoUrl ? (
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-surface bg-background">
                <Image src={activeBox.logoUrl} alt="" fill sizes="56px" className="object-cover" unoptimized />
              </span>
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-surface bg-accent text-xl font-black text-accent-foreground">
                {activeBox.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">{boxT("label")}</p>
              <p className="truncate text-lg font-black">{activeBox.name}</p>
              {activeBox.location ? <p className="truncate text-xs text-muted">{activeBox.location}</p> : null}
            </div>
            <span className="pb-2 text-accent">→</span>
          </div>
        </Link>
      ) : null}

      <GettingStartedChecklist userId={profile.id} progress={onboarding} />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("stats.workouts")}
          </p>

          <p className="mt-3 text-3xl font-black">
            {currentMonth.workoutResults}
          </p>

          <p className="mt-1 text-xs text-muted">{t("stats.thisMonth")}</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("stats.movementResults")}
          </p>

          <p className="mt-3 text-3xl font-black">
            {currentMonth.movementResults}
          </p>

          <p className="mt-1 text-xs text-muted">{t("stats.thisMonth")}</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("stats.personalRecords")}
          </p>

          <p className="mt-3 text-3xl font-black text-accent">
            {currentMonth.personalRecords}
          </p>

          <p className="mt-1 text-xs text-muted">{t("stats.thisMonth")}</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("stats.movementsTracked")}
          </p>

          <p className="mt-3 text-3xl font-black">{overall.movementsTracked}</p>

          <p className="mt-1 text-xs text-muted">{t("stats.allTime")}</p>
        </Card>
      </section>

      <TodaySchedule />

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
              <ButtonLink href="/workouts" className="px-5">
                {t("trainToday.browseWorkouts")}
              </ButtonLink>

              <ButtonLink
                href="/movements"
                variant="secondary"
                className="px-5"
              >
                {t("trainToday.browseMovements")}
              </ButtonLink>
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
                      {formatShortDate(activity.performedAt, locale)}
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
