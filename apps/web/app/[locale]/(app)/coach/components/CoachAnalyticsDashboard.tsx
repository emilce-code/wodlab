"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import type {
  CoachAnalyticsResponse,
  CoachProgrammingWorkspace,
} from "@/lib/coach-programming";
import { formatCalendarDate } from "@/lib/date-formatters";

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function initialRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 89);
  return { from: dateValue(from), to: dateValue(to) };
}

type BarDatum = { key: string; label: string; value: number };

function DistributionBars({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: BarDatum[];
}) {
  const maximum = Math.max(1, ...items.map((item) => item.value));
  return (
    <Card className="p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{empty}</p>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.key}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate font-medium">{item.label}</span>
                <span className="text-muted">{item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-elevated" role="img" aria-label={`${item.label}: ${item.value}`}>
                <div className="h-full rounded-full bg-accent" style={{ width: `${(item.value / maximum) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function CoachAnalyticsDashboard() {
  const t = useTranslations("coachAnalytics");
  const locale = useLocale();
  const [range] = useState(initialRange);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [groupId, setGroupId] = useState("");
  const [athleteId, setAthleteId] = useState("");
  const [workspace, setWorkspace] = useState<CoachProgrammingWorkspace | null>(null);
  const [analytics, setAnalytics] = useState<CoachAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from, to });
      if (groupId) params.set("groupId", groupId);
      if (athleteId) params.set("athleteProfileId", athleteId);
      const response = await fetch(`/api/coach-programming/analytics?${params}`);
      if (!response.ok) throw new Error();
      setAnalytics((await response.json()) as CoachAnalyticsResponse);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [athleteId, from, groupId, t, to]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ from: range.from, to: range.to });
    Promise.all([
      fetch(`/api/coach-programming/analytics?${params}`),
      fetch("/api/coach-programming/workspace"),
    ])
      .then(async ([analyticsResponse, workspaceResponse]) => {
        if (!analyticsResponse.ok || !workspaceResponse.ok) throw new Error();
        const [analyticsData, workspaceData] = await Promise.all([
          analyticsResponse.json() as Promise<CoachAnalyticsResponse>,
          workspaceResponse.json() as Promise<CoachProgrammingWorkspace>,
        ]);
        if (active) {
          setAnalytics(analyticsData);
          setWorkspace(workspaceData);
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
  }, [range.from, range.to, t]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load();
  }

  const summary = analytics?.summary;
  const summaryItems = [
    { key: "assigned", value: summary?.assigned ?? 0 },
    { key: "completed", value: summary?.completed ?? 0 },
    { key: "completionRate", value: `${summary?.completionRate ?? 0}%` },
    { key: "overdue", value: summary?.overdue ?? 0 },
    { key: "totalReps", value: summary?.totalReps ?? 0 },
    { key: "totalLoad", value: `${summary?.totalLoadKg ?? 0} kg` },
  ] as const;

  return (
    <div className="mt-8 space-y-6">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <form onSubmit={applyFilters}>
        <Card className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-semibold">{t("from")}<input type="date" required value={from} onChange={(event) => setFrom(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
          <label className="text-sm font-semibold">{t("to")}<input type="date" required value={to} onChange={(event) => setTo(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
          <label className="text-sm font-semibold">{t("group")}<select value={groupId} onChange={(event) => { setGroupId(event.target.value); setAthleteId(""); }} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"><option value="">{t("allGroups")}</option>{workspace?.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
          <label className="text-sm font-semibold">{t("athlete")}<select value={athleteId} onChange={(event) => { setAthleteId(event.target.value); setGroupId(""); }} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"><option value="">{t("allAthletes")}</option>{workspace?.athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.displayName}</option>)}</select></label>
          <div className="flex items-end"><Button type="submit" className="w-full" isLoading={loading}>{t("applyFilters")}</Button></div>
        </Card>
      </form>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {summaryItems.map((item) => <Card key={item.key} className="p-4"><p className="text-sm text-muted">{t(item.key)}</p><p className="mt-1 text-2xl font-bold">{item.value}</p></Card>)}
      </div>

      {loading ? <Card className="p-8 text-center text-muted">{t("loading")}</Card> : null}
      {!loading && summary?.assigned === 0 ? <Card className="p-8 text-center text-muted">{t("empty")}</Card> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold">{t("weeklyTrend")}</h2>
          <div className="mt-5 space-y-4">
            {analytics?.weekly.map((week) => (
              <div key={week.weekStart} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm">
                <span>{formatCalendarDate(week.weekStart, locale)}</span>
                <div className="h-3 overflow-hidden rounded-full bg-surface-elevated" role="img" aria-label={t("weekRateLabel", { date: formatCalendarDate(week.weekStart, locale), rate: week.completionRate })}><div className="h-full rounded-full bg-accent" style={{ width: `${week.completionRate}%` }} /></div>
                <span className="text-right font-semibold">{week.completionRate}%</span>
              </div>
            ))}
          </div>
        </Card>
        <DistributionBars title={t("workoutTypes")} empty={t("noDistribution")} items={(analytics?.workoutTypes ?? []).map((item) => ({ key: item.key, label: item.name, value: item.count }))} />
        <DistributionBars title={t("movementCategories")} empty={t("noMovementData")} items={(analytics?.movementCategories ?? []).map((item) => ({ key: item.key, label: item.name, value: item.count }))} />
        <DistributionBars title={t("topWorkouts")} empty={t("noDistribution")} items={(analytics?.workouts ?? []).map((item) => ({ key: item.id, label: item.name, value: item.count }))} />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5"><h2 className="text-lg font-bold">{t("athleteComparison")}</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-surface-elevated text-muted"><tr><th className="px-5 py-3">{t("athlete")}</th><th className="px-5 py-3">{t("assigned")}</th><th className="px-5 py-3">{t("completed")}</th><th className="px-5 py-3">{t("completionRate")}</th><th className="px-5 py-3">{t("overdue")}</th><th className="px-5 py-3">{t("volume")}</th><th className="px-5 py-3"><span className="sr-only">{t("actions")}</span></th></tr></thead>
            <tbody>{analytics?.athletes.map((athlete) => <tr key={athlete.id} className="border-t border-border"><td className="px-5 py-4 font-semibold">{athlete.name}</td><td className="px-5 py-4">{athlete.assigned}</td><td className="px-5 py-4">{athlete.completed}</td><td className="px-5 py-4">{athlete.completionRate}%</td><td className="px-5 py-4">{athlete.overdue}</td><td className="px-5 py-4">{athlete.totalReps} {t("repsShort")} · {Math.round(athlete.totalLoadKg * 10) / 10} kg</td><td className="px-5 py-4"><ButtonLink href={`/coach/${athlete.id}`} size="sm" variant="secondary">{t("openAthlete")}</ButtonLink></td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
