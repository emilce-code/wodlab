import { getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { formatDuration } from "@/lib/result-formatters";
import type {
  StrategyResultValue,
  WorkoutStrategy,
} from "@/lib/workout-strategies";

type Props = { strategy: WorkoutStrategy };

export default async function WorkoutStrategyCard({ strategy }: Props) {
  const t = await getTranslations("workoutStrategy");
  const target = formatTarget(strategy.target, t);

  return (
    <section className="mt-8" aria-labelledby="workout-strategy-title">
      <Card className="overflow-hidden border-accent/30">
        <div className="bg-accent/10 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {t("eyebrow")}
              </p>
              <h2
                id="workout-strategy-title"
                className="mt-1 text-xl font-bold"
              >
                {t("title")}
              </h2>
            </div>
            <Badge variant="accent">
              {t(`confidence.${strategy.history.confidence.toLowerCase()}`)}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            {t("description", { level: strategy.variant.level.name })}
          </p>
          {target ? (
            <div className="mt-4 rounded-xl bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("target")}
              </p>
              <p className="mt-1 text-2xl font-black text-accent">{target}</p>
              <p className="mt-1 text-xs text-muted">
                {t("basedOnAttempts", { count: strategy.history.attempts })}
              </p>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-background/70 p-4 text-sm">
              {t("firstAttempt")}
            </p>
          )}
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div>
            <h3 className="font-bold">{t("sectionPlan")}</h3>
            <div className="mt-3 space-y-3">
              {strategy.sections.map((section, index) => (
                <div
                  key={section.sectionId}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">
                      {t("section", { number: index + 1 })}
                    </p>
                    <Badge>{t(`effort.${section.effort.toLowerCase()}`)}</Badge>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted">
                    {section.movements.map((movement) => (
                      <li
                        key={movement.movementId}
                        className="flex items-start justify-between gap-3"
                      >
                        <span className="min-w-0 font-medium text-foreground">
                          {movement.name}
                        </span>
                        <span className="shrink-0 text-right">
                          {t(`approach.${toCamelCase(movement.approach)}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 text-sm">
            <p className="font-semibold">{t("transitions")}</p>
            <p className="mt-1 text-muted">
              {t(`transition.${toCamelCase(strategy.transition)}`)}
            </p>
          </div>

          {strategy.warnings.length > 0 ? (
            <div className="space-y-2">
              {strategy.warnings.map((warning) => (
                <p
                  key={warning}
                  className="rounded-lg bg-surface-elevated px-3 py-2 text-sm text-muted"
                >
                  {t(`warning.${toCamelCase(warning)}`)}
                </p>
              ))}
            </div>
          ) : null}
          <p className="text-xs text-muted">{t("disclaimer")}</p>
        </div>
      </Card>
    </section>
  );
}

function toCamelCase(value: string) {
  return value
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function formatTarget(
  target: WorkoutStrategy["target"],
  t: Awaited<ReturnType<typeof getTranslations<"workoutStrategy">>>,
) {
  if (!target.lower || !target.upper || !target.resultTypeKey) return null;
  const first = target.resultTypeKey === "TIME" ? target.lower : target.upper;
  const second = target.resultTypeKey === "TIME" ? target.upper : target.lower;
  return `${formatValue(first, target.resultTypeKey, t)} – ${formatValue(second, target.resultTypeKey, t)}`;
}

function formatValue(
  value: StrategyResultValue,
  resultTypeKey: string,
  t: Awaited<ReturnType<typeof getTranslations<"workoutStrategy">>>,
) {
  if (resultTypeKey === "TIME" && value.timeSeconds !== null)
    return formatDuration(value.timeSeconds);
  if (resultTypeKey === "ROUNDS_REPS")
    return t("roundsReps", {
      rounds: value.rounds ?? 0,
      reps: value.reps ?? 0,
    });
  if (resultTypeKey === "LOAD" && value.load !== null)
    return `${value.load} ${value.weightUnit ?? ""}`.trim();
  return t("reps", { count: value.reps ?? 0 });
}
