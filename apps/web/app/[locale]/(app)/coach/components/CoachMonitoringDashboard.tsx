"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import ProgressiveList from "@/components/ui/ProgressiveList";
import { formatCalendarDate } from "@/lib/date-formatters";
import type {
  CoachMonitoringResponse,
  CoachMonitoringStatus,
  CoachProgrammingWorkspace,
} from "@/lib/coach-programming";

const statusValues: CoachMonitoringStatus[] = [
  "ALL",
  "PLANNED",
  "COMPLETED",
  "OVERDUE",
  "NEEDS_REVIEW",
];

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function CoachMonitoringDashboard() {
  const t = useTranslations("coachMonitoring");
  const locale = useLocale();
  const initialDates = useMemo(() => {
    const to = new Date();
    to.setDate(to.getDate() + 14);
    const from = new Date();
    from.setDate(from.getDate() - 14);
    return { from: dateValue(from), to: dateValue(to) };
  }, []);
  const [workspace, setWorkspace] = useState<CoachProgrammingWorkspace | null>(
    null,
  );
  const [data, setData] = useState<CoachMonitoringResponse | null>(null);
  const [from, setFrom] = useState(initialDates.from);
  const [to, setTo] = useState(initialDates.to);
  const [groupId, setGroupId] = useState("");
  const [athleteId, setAthleteId] = useState("");
  const [status, setStatus] = useState<CoachMonitoringStatus>("ALL");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from, to, status });
      if (groupId) params.set("groupId", groupId);
      if (athleteId) params.set("athleteProfileId", athleteId);
      const [monitoringResponse, workspaceResponse] = await Promise.all([
        fetch(`/api/coach-programming/monitoring?${params}`),
        workspace
          ? Promise.resolve(null)
          : fetch("/api/coach-programming/workspace"),
      ]);
      if (
        !monitoringResponse.ok ||
        (workspaceResponse && !workspaceResponse.ok)
      ) {
        throw new Error();
      }
      setData((await monitoringResponse.json()) as CoachMonitoringResponse);
      if (workspaceResponse) {
        setWorkspace(
          (await workspaceResponse.json()) as CoachProgrammingWorkspace,
        );
      }
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [athleteId, from, groupId, status, t, to, workspace]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      from: initialDates.from,
      to: initialDates.to,
      status: "ALL",
    });
    Promise.all([
      fetch(`/api/coach-programming/monitoring?${params}`),
      fetch("/api/coach-programming/workspace"),
    ])
      .then(async ([monitoringResponse, workspaceResponse]) => {
        if (!monitoringResponse.ok || !workspaceResponse.ok) throw new Error();
        const [monitoring, programmingWorkspace] = await Promise.all([
          monitoringResponse.json() as Promise<CoachMonitoringResponse>,
          workspaceResponse.json() as Promise<CoachProgrammingWorkspace>,
        ]);
        if (active) {
          setData(monitoring);
          setWorkspace(programmingWorkspace);
        }
      })
      .catch(() => {
        if (active) setError(t("loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialDates.from, initialDates.to, t]);

  async function submitFeedback(event: FormEvent, assignmentId: string) {
    event.preventDefault();
    const value = feedback[assignmentId]?.trim();
    if (!value) return;
    setSubmittingId(assignmentId);
    setError(null);
    try {
      const response = await fetch(
        `/api/coach/assignments/${assignmentId}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: value }),
        },
      );
      if (!response.ok) throw new Error();
      setFeedback((current) => ({ ...current, [assignmentId]: "" }));
      await load();
    } catch {
      setError(t("feedbackError"));
    } finally {
      setSubmittingId(null);
    }
  }

  const summary = data?.summary;
  const today = dateValue(new Date());

  return (
    <div className="mt-8 space-y-6">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <Card className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-6">
          <label className="text-sm font-semibold">
            {t("from")}
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
            />
          </label>
          <label className="text-sm font-semibold">
            {t("to")}
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
            />
          </label>
          <label className="text-sm font-semibold">
            {t("group")}
            <select
              value={groupId}
              onChange={(event) => {
                setGroupId(event.target.value);
                setAthleteId("");
              }}
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
            >
              <option value="">{t("allGroups")}</option>
              {workspace?.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {t("athlete")}
            <select
              value={athleteId}
              onChange={(event) => {
                setAthleteId(event.target.value);
                setGroupId("");
              }}
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
            >
              <option value="">{t("allAthletes")}</option>
              {workspace?.athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {t("status")}
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as CoachMonitoringStatus)
              }
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
            >
              {statusValues.map((value) => (
                <option key={value} value={value}>
                  {t(`status${value}`)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button type="submit" className="w-full" isLoading={loading}>
              {t("applyFilters")}
            </Button>
          </div>
        </Card>
      </form>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {(
          ["total", "planned", "completed", "overdue", "needsReview"] as const
        ).map((key) => (
          <Card
            key={key}
            className={`p-4 ${key === "overdue" && (summary?.overdue ?? 0) > 0 ? "border-amber-500/50" : ""} ${key === "needsReview" && (summary?.needsReview ?? 0) > 0 ? "border-accent/50" : ""}`}
          >
            <p className="text-sm text-muted">{t(key)}</p>
            <p className="mt-1 text-2xl font-black">{summary?.[key] ?? 0}</p>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2" aria-label={t("loading")}>
          {[0, 1, 2, 3].map((item) => (
            <Card key={item} className="h-44 animate-pulse bg-surface-elevated">
              <span className="sr-only">{t("loading")}</span>
            </Card>
          ))}
        </div>
      ) : null}
      {!loading && data?.items.length === 0 ? (
        <Card className="p-8 text-center text-muted">{t("empty")}</Card>
      ) : null}
      <ProgressiveList
        key={`${groupId}-${athleteId}-${status}-${from}-${to}`}
        initialCount={10}
        increment={10}
        className="grid gap-4 lg:grid-cols-2"
      >
        {data?.items.map((item) => {
          const overdue =
            item.status === "PLANNED" &&
            item.scheduledDate.slice(0, 10) < today;
          return (
            <Card key={item.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={item.status === "COMPLETED" ? "accent" : "default"}
                >
                  {overdue
                    ? t("overdue")
                    : t(item.status === "COMPLETED" ? "completed" : "planned")}
                </Badge>
                <Badge>{item.workoutVariant.level.name}</Badge>
                {item.status === "COMPLETED" && !item.reviewedAt ? (
                  <Badge>{t("needsReview")}</Badge>
                ) : null}
              </div>
              <h2 className="mt-3 text-lg font-bold">{item.workout.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {item.athleteProfile.displayName} ·{" "}
                {formatCalendarDate(item.scheduledDate.slice(0, 10), locale)}
              </p>
              {item.coachNotes ? (
                <p className="mt-3 text-sm">{item.coachNotes}</p>
              ) : null}
              {item.athleteComment ? (
                <Alert className="mt-3">
                  <span className="font-semibold">{t("athleteComment")}</span>{" "}
                  {item.athleteComment}
                </Alert>
              ) : null}
              {item.coachFeedback ? (
                <Alert variant="success" className="mt-3">
                  <span className="font-semibold">{t("coachFeedback")}</span>{" "}
                  {item.coachFeedback}
                </Alert>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink
                  href={`/coach/${item.athleteProfile.id}`}
                  size="sm"
                  variant="secondary"
                >
                  {t("openAthlete")}
                </ButtonLink>
              </div>
              {item.status === "COMPLETED" && !item.reviewedAt ? (
                <form
                  onSubmit={(event) => void submitFeedback(event, item.id)}
                  className="mt-4 border-t border-border pt-4"
                >
                  <label
                    htmlFor={`feedback-${item.id}`}
                    className="text-sm font-semibold"
                  >
                    {t("feedback")}
                  </label>
                  <textarea
                    id={`feedback-${item.id}`}
                    required
                    maxLength={2000}
                    value={feedback[item.id] ?? ""}
                    onChange={(event) =>
                      setFeedback((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-24 w-full rounded-lg border border-border bg-background p-3"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="mt-2"
                    isLoading={submittingId === item.id}
                  >
                    {t("submitFeedback")}
                  </Button>
                </form>
              ) : null}
            </Card>
          );
        })}
      </ProgressiveList>
    </div>
  );
}
