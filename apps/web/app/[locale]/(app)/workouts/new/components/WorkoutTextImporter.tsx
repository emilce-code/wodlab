"use client";

import { useState } from "react";
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
    variants: Array<{
      levelKey: string;
      name: string | null;
      notes: string | null;
      section: ImportedSection;
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

type Props = { onApply: (result: WorkoutImportResult) => void };

export default function WorkoutTextImporter({ onApply }: Props) {
  const t = useTranslations("workouts.create.importer");
  const [text, setText] = useState("");
  const [result, setResult] = useState<WorkoutImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      setError(t("parseError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label htmlFor="workout-import-text" className="text-sm font-medium">
        {t("label")}
      </label>
      <textarea
        id="workout-import-text"
        rows={14}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setResult(null);
        }}
        placeholder={t("placeholder")}
        className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-3 font-mono text-sm outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
      />
      <p className="mt-2 text-xs leading-5 text-muted">{t("formatHint")}</p>
      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
      <Button
        type="button"
        onClick={parse}
        disabled={loading || text.trim().length < 3}
        className="mt-3 w-full sm:w-auto"
      >
        {loading ? t("parsing") : t("parse")}
      </Button>

      {result ? (
        <div className="mt-4 rounded-lg border border-border bg-background p-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-accent">
              {t("variantsDetected", {
                count: result.summary.detectedVariants,
              })}
            </span>
            {result.summary.detectedPrescriptions > 0 ? (
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-accent">
                {t("prescriptionsDetected", {
                  count: result.summary.detectedPrescriptions,
                })}
              </span>
            ) : null}
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400">
              {t("matched", { count: result.summary.matchedMovements })}
            </span>
            {result.summary.unresolvedMovements > 0 ? (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-300">
                {t("needsReview", {
                  count: result.summary.unresolvedMovements,
                })}
              </span>
            ) : null}
          </div>
          <p className="mt-3 font-semibold">{result.draft.name}</p>
          <p className="mt-1 text-sm text-muted">
            {t("detectedType", { type: result.draft.typeKey })}
          </p>
          {result.draft.variants.length ? (
            <ul className="mt-3 flex flex-wrap gap-2 text-xs">
              {result.draft.variants.map((variant) => (
                <li
                  key={variant.levelKey}
                  className="rounded-full border border-border px-2.5 py-1 font-medium"
                >
                  {variant.levelKey}
                </li>
              ))}
            </ul>
          ) : null}
          {result.issues.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {result.issues.map((issue, index) => (
                <li
                  key={`${issue.line}-${issue.code}-${index}`}
                  className="rounded-md bg-amber-500/10 p-2 text-amber-800 dark:text-amber-200"
                >
                  {t(`issues.${issue.code}`, { line: issue.line })}:{" "}
                  {issue.source}
                  {issue.candidates.length
                    ? ` (${issue.candidates
                        .map((item) => item.name)
                        .join(", ")})`
                    : ""}
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            type="button"
            onClick={() => {
              onApply(result);
            }}
            variant="secondary"
            className="mt-4 w-full sm:w-auto"
          >
            {t("apply")}
          </Button>
          <p className="mt-2 text-xs text-muted">{t("applyHint")}</p>
        </div>
      ) : null}
    </div>
  );
}
