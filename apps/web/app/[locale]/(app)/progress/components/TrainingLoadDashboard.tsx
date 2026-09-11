"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { AthleteTrainingLoadResponse } from "@/lib/athlete-insights";

export default function TrainingLoadDashboard() {
  const t = useTranslations("progress.load");
  const locale = useLocale();
  const [data, setData] = useState<AthleteTrainingLoadResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/insights/load", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setData((await response.json()) as AthleteTrainingLoadResponse);
        setFailed(false);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setFailed(true);
      });
    return () => controller.abort();
  }, [reload]);

  const number = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const maxLoad = Math.max(1, ...(data?.weeks.map((week) => week.load) ?? []));

  return (
    <section className="mt-8" aria-labelledby="training-load-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t("eyebrow")}
        </p>
        <h2 id="training-load-title" className="mt-2 text-2xl font-bold">
          {t("title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t("description")}</p>
      </div>
      {failed ? (
        <Card className="mt-5 p-5 text-center">
          <p>{t("error")}</p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => setReload((value) => value + 1)}
          >
            {t("retry")}
          </Button>
        </Card>
      ) : null}
      {!data && !failed ? (
        <div
          className="mt-5 h-44 animate-pulse rounded-xl border border-border bg-surface"
          aria-label={t("loading")}
        />
      ) : null}
      {data ? (
        <div className="mt-5 space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{t("workloadRatio")}</p>
                <p className="mt-1 text-4xl font-black text-accent">
                  {data.workloadRatio === null
                    ? "—"
                    : number(data.workloadRatio)}
                </p>
              </div>
              <Badge
                variant={data.status === "BALANCED" ? "accent" : undefined}
              >
                {t(`status.${data.status}`)}
              </Badge>
            </div>
            <p className="mt-4 text-sm font-semibold">
              {t(`recommendation.${data.recommendation}`)}
            </p>
            <p className="mt-2 text-xs text-muted">{t("ratioHelp")}</p>
          </Card>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [t("acuteLoad"), number(data.acuteLoad)],
              [t("baseline"), number(data.chronicWeeklyLoad)],
              [t("sessions"), String(data.sessionsLast7Days)],
              [t("restDays"), String(data.restDaysLast7Days)],
            ].map(([label, value]) => (
              <Card key={label} className="min-w-0 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-black">{value}</p>
              </Card>
            ))}
          </div>
          <Card className="p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="font-bold">{t("trend")}</h3>
                <p className="mt-1 text-xs text-muted">{t("trendHelp")}</p>
              </div>
              <span className="text-xs text-muted">
                {t("volume", { value: number(data.volumeKgLast7Days) })}
              </span>
            </div>
            <div
              className="mt-5 flex h-28 items-end gap-2"
              role="img"
              aria-label={t("trendLabel")}
            >
              {data.weeks.map((week) => (
                <div
                  key={week.startDate}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="text-[10px] text-muted">
                    {week.sessions}
                  </span>
                  <div
                    className="w-full rounded-t bg-accent"
                    style={{
                      height: `${Math.max(4, (week.load / maxLoad) * 88)}px`,
                    }}
                  />
                  <span className="text-[9px] text-muted">
                    {new Intl.DateTimeFormat(locale, {
                      month: "numeric",
                      day: "numeric",
                    }).format(new Date(week.startDate))}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          {data.consecutiveTrainingDays >= 4 ? (
            <Card className="border-amber-500/40 p-4">
              <p className="font-semibold">
                {t("consecutive", { count: data.consecutiveTrainingDays })}
              </p>
            </Card>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
