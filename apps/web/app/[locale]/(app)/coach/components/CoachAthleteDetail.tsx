"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressiveList from "@/components/ui/ProgressiveList";
import { formatCalendarDate } from "@/lib/date-formatters";

import CoachWeeklyPlanner from "./CoachWeeklyPlanner";

type AthleteOverview = {
  id: string;
  displayName: string;
  preferredWeightUnit: "KG" | "LB";
  user: { email: string };
  workoutResults: {
    id: string;
    performedAt: string;
    workout: { id: string; name: string };
    workoutVariant: { level: { key: string; name: string } };
    resultType: { key: string; name: string };
    timeSeconds: number | null;
    rounds: number | null;
    reps: number | null;
    load: number | null;
    weightUnit: "KG" | "LB" | null;
  }[];
  scheduledWorkouts: {
    id: string;
    scheduledDate: string;
    status: "PLANNED" | "COMPLETED";
    coachNotes: string | null;
    coachFeedback: string | null;
    reviewedAt: string | null;
    workout: { id: string; name: string };
    workoutVariant: {
      id: string;
      name: string | null;
      level: { key: string; name: string };
    };
    workoutResult: { id: string } | null;
  }[];
};

function resultValue(result: AthleteOverview["workoutResults"][number]) {
  if (result.timeSeconds !== null)
    return `${Math.floor(result.timeSeconds / 60)}:${String(result.timeSeconds % 60).padStart(2, "0")}`;
  if (result.rounds !== null) return `${result.rounds} + ${result.reps ?? 0}`;
  if (result.load !== null) return `${result.load} ${result.weightUnit ?? ""}`;
  if (result.reps !== null) return `${result.reps} reps`;
  return "—";
}

export default function CoachAthleteDetail({
  athleteId,
}: {
  athleteId: string;
}) {
  const t = useTranslations("coach");
  const locale = useLocale();
  const [athlete, setAthlete] = useState<AthleteOverview | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const athleteResponse = await fetch(`/api/coach/athletes/${athleteId}`);
      if (!athleteResponse.ok) throw new Error();
      setAthlete((await athleteResponse.json()) as AthleteOverview);
    } catch {
      setError(t("loadAthleteError"));
    }
  }, [athleteId, t]);

  useEffect(() => {
    let active = true;
    fetch(`/api/coach/athletes/${athleteId}`)
      .then(async (athleteResponse) => {
        if (!athleteResponse.ok) throw new Error();
        const athleteData = (await athleteResponse.json()) as AthleteOverview;
        if (active) setAthlete(athleteData);
      })
      .catch(() => {
        if (active) setError(t("loadAthleteError"));
      });
    return () => {
      active = false;
    };
  }, [athleteId, t]);

  async function review(id: string) {
    const value = feedback[id]?.trim();
    if (!value) return;
    setSubmitting(true);
    const response = await fetch(`/api/coach/assignments/${id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: value }),
    });
    setSubmitting(false);
    if (!response.ok) return setError(t("reviewError"));
    await load();
  }

  if (!athlete) {
    return error ? (
      <Alert variant="error" className="mt-8">
        {error}
      </Alert>
    ) : (
      <div className="mt-8 space-y-4" aria-label={t("loading")}>
        <Card className="h-28 animate-pulse bg-surface-elevated">
          <span className="sr-only">{t("loading")}</span>
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Card key={item} className="h-24 animate-pulse bg-surface-elevated">
              <span className="sr-only">{t("loading")}</span>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <Card className="p-6">
        <h2 className="text-2xl font-bold">{athlete.displayName}</h2>
        <p className="mt-1 text-sm text-muted">
          {athlete.user.email} · {athlete.preferredWeightUnit}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted">{t("planned")}</p>
          <p className="mt-1 text-2xl font-black">
            {
              athlete.scheduledWorkouts.filter(
                (item) => item.status === "PLANNED",
              ).length
            }
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">{t("completed")}</p>
          <p className="mt-1 text-2xl font-black">
            {
              athlete.scheduledWorkouts.filter(
                (item) => item.status === "COMPLETED",
              ).length
            }
          </p>
        </Card>
        <Card className="col-span-2 p-4 sm:col-span-1">
          <p className="text-sm text-muted">{t("recentResults")}</p>
          <p className="mt-1 text-2xl font-black">
            {athlete.workoutResults.length}
          </p>
        </Card>
      </div>

      <CoachWeeklyPlanner athleteId={athleteId} onChanged={load} />

      <section>
        <h2 className="text-xl font-bold">{t("assignmentsTitle")}</h2>
        {athlete.scheduledWorkouts.length === 0 ? (
          <Card className="mt-4 p-8 text-center text-muted">
            {t("assignmentsEmpty")}
          </Card>
        ) : null}
        <ProgressiveList
          initialCount={10}
          increment={10}
          className="mt-4 grid gap-4 lg:grid-cols-2"
        >
          {athlete.scheduledWorkouts.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={item.status === "COMPLETED" ? "accent" : "default"}
                >
                  {item.status === "COMPLETED" ? t("completed") : t("planned")}
                </Badge>
                <Badge>{item.workoutVariant.level.name}</Badge>
              </div>
              <h3 className="mt-3 text-lg font-bold">{item.workout.name}</h3>
              <p className="mt-1 text-sm text-muted">
                {formatCalendarDate(item.scheduledDate.slice(0, 10), locale)}
              </p>
              {item.coachNotes ? (
                <p className="mt-3 text-sm">{item.coachNotes}</p>
              ) : null}
              {item.coachFeedback ? (
                <Alert variant="success" className="mt-4">
                  {item.coachFeedback}
                </Alert>
              ) : null}
              {item.status === "COMPLETED" && !item.reviewedAt ? (
                <div className="mt-4">
                  <textarea
                    value={feedback[item.id] ?? ""}
                    onChange={(event) =>
                      setFeedback((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    placeholder={t("feedbackPlaceholder")}
                    className="w-full rounded-lg border border-border bg-background p-3"
                  />
                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={() => void review(item.id)}
                    className="mt-2"
                  >
                    {t("markReviewed")}
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </ProgressiveList>
      </section>

      <section>
        <h2 className="text-xl font-bold">{t("recentResults")}</h2>
        {athlete.workoutResults.length === 0 ? (
          <Card className="mt-4 p-8 text-center text-muted">
            {t("resultsEmpty")}
          </Card>
        ) : null}
        <ProgressiveList
          initialCount={10}
          increment={10}
          className="mt-4 space-y-3"
        >
          {athlete.workoutResults.map((result) => (
            <Card
              key={result.id}
              className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{result.workout.name}</p>
                <p className="text-sm text-muted">
                  {formatCalendarDate(result.performedAt.slice(0, 10), locale)}{" "}
                  · {result.workoutVariant.level.name}
                </p>
              </div>
              <p className="shrink-0 font-bold text-accent">
                {resultValue(result)}
              </p>
            </Card>
          ))}
        </ProgressiveList>
      </section>
    </div>
  );
}
