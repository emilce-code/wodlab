"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
import type { MovementOption } from "./WorkoutMovementForm";

type ImportedPrescription = {
  categoryKey: "MEN" | "WOMEN";
  reps: number | null;
  weight: number | null;
  weightUnit: "KG" | "LB" | null;
  distance: number | null;
  calories: number | null;
  durationSeconds: number | null;
  notes: string | null;
};

type ImportedMovement = {
  sourceLine: number;
  source: string;
  matchStatus: "MATCHED" | "AMBIGUOUS" | "UNRESOLVED";
  movement: MovementOption | null;
  reps: number | null;
  weight: number | null;
  weightUnit: "KG" | "LB" | null;
  distance: number | null;
  calories: number | null;
  durationSeconds: number | null;
  notes: string | null;
  prescriptions: ImportedPrescription[];
};

type ImportedSection = {
  typeKey: string;
  role: "WARM_UP" | "STRENGTH" | "WOD" | "ACCESSORY" | "COOLDOWN" | "CUSTOM";
  rounds: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  repScheme: number[];
  notes: string | null;
  movements: ImportedMovement[];
};

export type WorkoutImportResult = {
  draft: {
    name: string;
    description: string | null;
    typeKey: string;
    section: ImportedSection;
    sections?: ImportedSection[];
    variants: Array<{
      levelKey: string;
      name: string | null;
      notes: string | null;
      section: ImportedSection;
      sections?: ImportedSection[];
    }>;
  };
  summary: {
    totalLines: number;
    detectedVariants: number;
    detectedPrescriptions: number;
    matchedMovements: number;
    unresolvedMovements: number;
  };
  issues: Array<{
    line: number;
    code: "AMBIGUOUS_MOVEMENT" | "UNKNOWN_MOVEMENT" | "MULTIPLE_LOADS";
    source: string;
    candidates: Array<{ id: string; name: string }>;
  }>;
};

type ImportStage = "compose" | "preview" | "review";

type Props = { onApply: (result: WorkoutImportResult) => void };

const EXAMPLE_KEYS = ["forTime", "amrap", "strength"] as const;

function collectSections(result: WorkoutImportResult) {
  if (result.draft.variants.length) {
    return result.draft.variants.flatMap((variant) =>
      (variant.sections?.length ? variant.sections : [variant.section]).map(
        (section, index) => ({
          key: `${variant.levelKey}-${index}`,
          title: variant.name ?? variant.levelKey,
          section,
        }),
      ),
    );
  }

  return (result.draft.sections?.length
    ? result.draft.sections
    : [result.draft.section]
  ).map((section, index) => ({
    key: `draft-${index}`,
    title: result.draft.name,
    section,
  }));
}

function countMovements(result: WorkoutImportResult) {
  return collectSections(result).reduce(
    (total, item) => total + item.section.movements.length,
    0,
  );
}

function formatSectionMeta(section: ImportedSection) {
  const parts = [];
  if (section.rounds) parts.push(`${section.rounds} rounds`);
  if (section.durationSeconds) parts.push(`${section.durationSeconds / 60} min`);
  if (section.repScheme.length) parts.push(section.repScheme.join("-"));
  return parts.join(" · ");
}

function hasDetectedDetails(movement: ImportedMovement) {
  return Boolean(
    movement.reps ||
      movement.weight ||
      movement.distance ||
      movement.calories ||
      movement.durationSeconds ||
      movement.prescriptions.length,
  );
}

function updateSectionMovement(
  section: ImportedSection,
  line: number,
  movement: MovementOption,
) {
  return {
    ...section,
    movements: section.movements.map((item) =>
      item.sourceLine === line
        ? { ...item, matchStatus: "MATCHED" as const, movement }
        : item,
    ),
  };
}

export default function WorkoutTextImporter({ onApply }: Props) {
  const t = useTranslations("workouts.create.importer");
  const [text, setText] = useState("");
  const [result, setResult] = useState<WorkoutImportResult | null>(null);
  const [stage, setStage] = useState<ImportStage>("compose");
  const [loading, setLoading] = useState(false);
  const [resolvingLine, setResolvingLine] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sections = useMemo(
    () => (result ? collectSections(result) : []),
    [result],
  );
  const movementCount = useMemo(
    () => (result ? countMovements(result) : 0),
    [result],
  );
  const reviewItems = useMemo(
    () =>
      result
        ? result.issues.filter((issue) => issue.code !== "MULTIPLE_LOADS")
        : [],
    [result],
  );

  async function parse() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/workout-imports/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as WorkoutImportResult & {
        message?: string;
      };
      if (!response.ok) throw new Error(data.message);
      setResult(data);
      setStage("preview");
    } catch {
      setError(t("parseError"));
    } finally {
      setLoading(false);
    }
  }

  async function resolveCandidate(
    line: number,
    candidate: { id: string; name: string },
  ) {
    setResolvingLine(line);
    try {
      const response = await fetch(
        `/api/movements?search=${encodeURIComponent(candidate.name)}`,
      );
      const movements = response.ok
        ? ((await response.json()) as MovementOption[])
        : [];
      const movement =
        movements.find((item) => item.id === candidate.id) ?? movements[0];
      if (!movement) return;

      setResult((current) => {
        if (!current) return current;

        return {
          ...current,
          draft: {
            ...current.draft,
            section: updateSectionMovement(
              current.draft.section,
              line,
              movement,
            ),
            sections: current.draft.sections?.map((section) =>
              updateSectionMovement(section, line, movement),
            ),
            variants: current.draft.variants.map((variant) => ({
              ...variant,
              section: updateSectionMovement(variant.section, line, movement),
              sections: variant.sections?.map((section) =>
                updateSectionMovement(section, line, movement),
              ),
            })),
          },
          summary: {
            ...current.summary,
            matchedMovements: current.summary.matchedMovements + 1,
            unresolvedMovements: Math.max(
              0,
              current.summary.unresolvedMovements - 1,
            ),
          },
          issues: current.issues.filter((issue) => issue.line !== line),
        };
      });
    } finally {
      setResolvingLine(null);
    }
  }

  if (stage === "preview" && result) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{t("understoodTitle")}</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {t("understoodDescription")}
              </p>
            </div>
            {result.summary.unresolvedMovements > 0 ? (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                {t("needsReview", {
                  count: result.summary.unresolvedMovements,
                })}
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {t("matched", { count: result.summary.matchedMovements })}
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <SummaryStat value={sections.length} label={t("sections")} />
            <SummaryStat value={movementCount} label={t("movements")} />
            <SummaryStat
              value={result.summary.matchedMovements}
              label={t("matchedShort")}
              tone="success"
            />
            <SummaryStat
              value={result.summary.unresolvedMovements}
              label={t("reviewShort")}
              tone={result.summary.unresolvedMovements > 0 ? "warning" : "muted"}
            />
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((item, index) => {
            const meta = formatSectionMeta(item.section);

            return (
              <div
                key={`${item.key}-${index}`}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {item.title || `${t("sectionFallback")} ${index + 1}`}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {item.section.typeKey}
                      {` · ${item.section.role}`}
                      {meta ? ` · ${meta}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                    {item.section.movements.length}
                  </span>
                </div>

                <div className="mt-3 divide-y divide-border">
                  {item.section.movements.map((movement) => (
                    <div
                      key={`${movement.sourceLine}-${movement.source}`}
                      className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {movement.movement?.name ?? movement.source}
                        </p>
                        {hasDetectedDetails(movement) ? (
                          <p className="mt-0.5 text-xs text-muted">
                            {t("detected")}
                          </p>
                        ) : null}
                      </div>
                      <StatusBadge status={movement.matchStatus} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStage("compose")}
          >
            {t("editText")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (reviewItems.length) setStage("review");
              else onApply(result);
            }}
          >
            {reviewItems.length
              ? t("reviewItems", { count: reviewItems.length })
              : t("continueToBuilder")}
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "review" && result) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold">{t("reviewTitle")}</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {t("reviewDescription")}
          </p>
        </div>

        {reviewItems.length ? (
          <div className="space-y-3">
            {reviewItems.map((issue, index) => (
              <div
                key={`${issue.line}-${issue.code}-${index}`}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{issue.source}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t(`issues.${issue.code}`, { line: issue.line })}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    {t("needsReviewBadge")}
                  </span>
                </div>

                {issue.candidates.length ? (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {t("suggestedMatches")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {issue.candidates.map((candidate) => (
                        <Button
                          key={candidate.id}
                          type="button"
                          variant="secondary"
                          onClick={() => resolveCandidate(issue.line, candidate)}
                          disabled={resolvingLine === issue.line}
                          className="min-h-8 px-3 py-1.5 text-xs"
                        >
                          {candidate.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 rounded-md bg-muted/10 p-2 text-xs leading-5 text-muted">
                    {t("manualReviewHint")}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {t("allConfirmed")}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStage("preview")}
          >
            {t("backToPreview")}
          </Button>
          <Button type="button" onClick={() => onApply(result)}>
            {t("continueToBuilder")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="workout-import-text" className="text-sm font-medium">
        {t("label")}
      </label>
      <textarea
        id="workout-import-text"
        rows={12}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setResult(null);
          setStage("compose");
        }}
        placeholder={t("placeholder")}
        className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-3 font-mono text-sm outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs leading-5 text-muted">{t("formatHint")}</p>
        <span className="shrink-0 text-xs text-muted">
          {text.trim().length}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("examplesTitle")}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {EXAMPLE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setText(t(`exampleTexts.${key}`));
                setResult(null);
                setStage("compose");
              }}
              className="rounded-lg border border-border px-2.5 py-2 text-xs font-medium transition hover:border-accent/50 hover:bg-accent/5"
            >
              {t(`examples.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
      <Button
        type="button"
        onClick={parse}
        disabled={loading || text.trim().length < 3}
        className="mt-4 w-full sm:w-auto"
      >
        {loading ? t("parsing") : t("parse")}
      </Button>
    </div>
  );
}

function SummaryStat({
  value,
  label,
  tone = "default",
}: {
  value: number;
  label: string;
  tone?: "default" | "success" | "warning" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-700 dark:text-amber-300"
        : tone === "muted"
          ? "text-muted"
          : "text-foreground";

  return (
    <div className="rounded-lg border border-border p-3">
      <p className={`text-lg font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: ImportedMovement["matchStatus"];
}) {
  const t = useTranslations("workouts.create.importer");

  if (status === "MATCHED") {
    return (
      <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        {t("matchedBadge")}
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
      {t("needsReviewBadge")}
    </span>
  );
}
