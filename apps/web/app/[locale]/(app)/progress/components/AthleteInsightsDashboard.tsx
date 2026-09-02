"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type {
  AthleteBalanceInsightsResponse,
  AthleteConsistencyInsightsResponse,
  AthleteInsightsBreakdownItem,
  AthleteInsightsComparison,
  AthleteInsightsData,
  AthleteInsightsPeriod,
  AthletePerformanceInsightsResponse,
} from "@/lib/athlete-insights";
import { formatShortDate } from "@/lib/date-formatters";

const periods: AthleteInsightsPeriod[] = ["30D", "90D", "6M", "1Y", "ALL"];

type LoadState =
  | { status: "loading"; data: null }
  | { status: "success"; data: AthleteInsightsData }
  | { status: "error"; data: null };

async function fetchInsights<T>(section: string, query: URLSearchParams) {
  const response = await fetch(`/api/insights/${section}?${query}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to load ${section} insights`);
  }

  return (await response.json()) as T;
}

function BreakdownBars({
  items,
  emptyLabel,
}: {
  items: AthleteInsightsBreakdownItem[];
  emptyLabel: string;
}) {
  const visibleItems = items.filter((item) => item.count > 0);

  if (visibleItems.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      {visibleItems.map((item) => (
        <div key={item.key}>
          <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.name}</span>
            <span className="shrink-0 text-muted">
              {item.count} · {item.percentage}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-elevated">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max(item.percentage, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AthleteInsightsDashboard() {
  const t = useTranslations("progress.insights");
  const locale = useLocale();
  const [period, setPeriod] = useState<AthleteInsightsPeriod>("90D");
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<LoadState>({
    status: "loading",
    data: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const query = new URLSearchParams({ period, timeZone });

    Promise.all([
      fetchInsights<AthleteConsistencyInsightsResponse>("consistency", query),
      fetchInsights<AthletePerformanceInsightsResponse>("performance", query),
      fetchInsights<AthleteBalanceInsightsResponse>("balance", query),
    ])
      .then(([consistency, performance, balance]) => {
        if (!controller.signal.aborted) {
          setState({
            status: "success",
            data: {
              consistency: consistency.consistency,
              performance: performance.performance,
              balance: balance.balance,
            },
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: "error", data: null });
        }
      });

    return () => controller.abort();
  }, [period, reloadKey]);

  function selectPeriod(nextPeriod: AthleteInsightsPeriod) {
    if (nextPeriod === period) {
      return;
    }

    setState({ status: "loading", data: null });
    setPeriod(nextPeriod);
  }

  function retry() {
    setState({ status: "loading", data: null });
    setReloadKey((current) => current + 1);
  }

  function formatNumber(value: number) {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
    }).format(value);
  }

  function comparisonLabel(comparison: AthleteInsightsComparison) {
    if (comparison.previous === null || comparison.absoluteChange === null) {
      return t("comparison.allTime");
    }

    if (comparison.absoluteChange === 0) {
      return t("comparison.noChange");
    }

    return comparison.absoluteChange > 0
      ? t("comparison.more", { value: formatNumber(comparison.absoluteChange) })
      : t("comparison.less", {
          value: formatNumber(Math.abs(comparison.absoluteChange)),
        });
  }

  const data = state.data;
  const hasActivity = data ? data.consistency.totalSessions.current > 0 : false;

  return (
    <section className="mt-10" aria-labelledby="athlete-insights-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {t("eyebrow")}
          </p>
          <h2 id="athlete-insights-title" className="mt-2 text-2xl font-bold">
            {t("title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {t("description")}
          </p>
        </div>

        <div
          className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1"
          role="group"
          aria-label={t("periodLabel")}
        >
          {periods.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => selectPeriod(value)}
              aria-pressed={period === value}
              className={[
                "min-h-10 shrink-0 rounded-lg px-3 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                period === value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-surface-elevated hover:text-foreground",
              ].join(" ")}
            >
              {t(`periods.${value}`)}
            </button>
          ))}
        </div>
      </div>

      {state.status === "loading" ? (
        <div
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-busy="true"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : null}

      {state.status === "error" ? (
        <Card className="mt-6 p-6 text-center">
          <p className="font-semibold">{t("error.title")}</p>
          <p className="mt-2 text-sm text-muted">{t("error.description")}</p>
          <Button className="mt-5" variant="secondary" onClick={retry}>
            {t("error.retry")}
          </Button>
        </Card>
      ) : null}

      {state.status === "success" && data && !hasActivity ? (
        <Card className="mt-6 border-dashed p-8 text-center">
          <p className="font-semibold">{t("empty.title")}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {t("empty.description")}
          </p>
        </Card>
      ) : null}

      {state.status === "success" && data && hasActivity ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: t("metrics.sessions"),
                value: data.consistency.totalSessions.current,
                comparison: data.consistency.totalSessions,
              },
              {
                label: t("metrics.activeDays"),
                value: data.consistency.activeDays.current,
                comparison: data.consistency.activeDays,
              },
              {
                label: t("metrics.weeklyAverage"),
                value: data.consistency.weeklyAverage.current,
                comparison: data.consistency.weeklyAverage,
              },
              {
                label: t("metrics.personalRecords"),
                value: data.performance.personalRecords.current,
                comparison: data.performance.personalRecords,
              },
            ].map((metric) => (
              <Card key={metric.label} className="min-w-0 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-black text-accent">
                  {formatNumber(metric.value)}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {comparisonLabel(metric.comparison)}
                </p>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t("streaks.current")}
              </p>
              <p className="mt-3 text-3xl font-black">
                {t("streaks.days", { count: data.consistency.currentStreak })}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t("streaks.longest")}
              </p>
              <p className="mt-3 text-3xl font-black">
                {t("streaks.days", { count: data.consistency.longestStreak })}
              </p>
            </Card>
          </div>

          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold">{t("performance.title")}</h3>
                <p className="mt-1 text-sm text-muted">
                  {t("performance.description")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">
                  {t("performance.improving", {
                    count: data.performance.improvingTracks,
                  })}
                </Badge>
                <Badge>
                  {t("performance.stable", {
                    count: data.performance.stableTracks,
                  })}
                </Badge>
                <Badge>
                  {t("performance.declining", {
                    count: data.performance.decliningTracks,
                  })}
                </Badge>
              </div>
            </div>

            {data.performance.highlights.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {data.performance.highlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="min-w-0 rounded-lg border border-border bg-background/40 p-4"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {highlight.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted">
                          {highlight.metricName} ·{" "}
                          {t("performance.attempts", {
                            count: highlight.attemptCount,
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          highlight.direction === "IMPROVING"
                            ? "accent"
                            : undefined
                        }
                      >
                        {t(`directions.${highlight.direction}`)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold">
                      {highlight.improvementPercentage === null
                        ? t("performance.scoreImproved")
                        : t("performance.change", {
                            value: formatNumber(
                              highlight.improvementPercentage,
                            ),
                          })}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatShortDate(highlight.latestPerformedAt, locale)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted">
                {t("performance.notEnoughData")}
              </p>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h3 className="text-lg font-bold">{t("balance.workoutTypes")}</h3>
              <div className="mt-5">
                <BreakdownBars
                  items={data.balance.workoutTypes}
                  emptyLabel={t("balance.empty")}
                />
              </div>
            </Card>
            <Card className="p-5 sm:p-6">
              <h3 className="text-lg font-bold">
                {t("balance.movementCategories")}
              </h3>
              <div className="mt-5">
                <BreakdownBars
                  items={data.balance.movementCategories}
                  emptyLabel={t("balance.empty")}
                />
              </div>
            </Card>
            <Card className="p-5 sm:p-6">
              <h3 className="text-lg font-bold">{t("balance.levels")}</h3>
              <div className="mt-5">
                <BreakdownBars
                  items={data.balance.workoutLevels}
                  emptyLabel={t("balance.empty")}
                />
              </div>
            </Card>
            <Card className="p-5 sm:p-6">
              <h3 className="text-lg font-bold">
                {t("balance.prescriptions")}
              </h3>
              <div className="mt-5">
                <BreakdownBars
                  items={data.balance.prescriptionCategories}
                  emptyLabel={t("balance.empty")}
                />
              </div>
            </Card>
          </div>

          {data.balance.underrepresentedAreas.length > 0 ? (
            <Card className="p-5 sm:p-6">
              <h3 className="text-lg font-bold">
                {t("balance.opportunities")}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {t("balance.opportunitiesDescription")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.balance.underrepresentedAreas.map((area) => (
                  <Badge key={`${area.dimension}:${area.key}`}>
                    {area.name} · {area.percentage}%
                  </Badge>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
