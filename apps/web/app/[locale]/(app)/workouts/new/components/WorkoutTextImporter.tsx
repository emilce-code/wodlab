"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
import type { MovementOption } from "./WorkoutMovementForm";

export type WorkoutImportResult = {
  draft: {
    name: string;
    description: string | null;
    typeKey: string;
    section: {
      typeKey: string;
      rounds: number | null;
      durationSeconds: number | null;
      restSeconds: number | null;
      repScheme: number[];
      notes: string | null;
      movements: Array<{
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
      }>;
    };
  };
  summary: {
    totalLines: number;
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
  const [expanded, setExpanded] = useState(false);
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
      const data = (await response.json()) as WorkoutImportResult & { message?: string };
      if (!response.ok) throw new Error(data.message);
      setResult(data);
    } catch {
      setError(t("parseError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span>
          <span className="block font-semibold">{t("title")}</span>
          <span className="mt-0.5 block text-xs text-muted">{t("description")}</span>
        </span>
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>

      {expanded ? (
        <div className="border-t border-border p-4">
          <label htmlFor="workout-import-text" className="text-sm font-medium">
            {t("label")}
          </label>
          <textarea
            id="workout-import-text"
            rows={9}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setResult(null);
            }}
            placeholder={t("placeholder")}
            className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-3 font-mono text-sm outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
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
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400">
                  {t("matched", { count: result.summary.matchedMovements })}
                </span>
                {result.summary.unresolvedMovements > 0 ? (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-300">
                    {t("needsReview", { count: result.summary.unresolvedMovements })}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 font-semibold">{result.draft.name}</p>
              <p className="mt-1 text-sm text-muted">{t("detectedType", { type: result.draft.typeKey })}</p>
              {result.issues.length ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {result.issues.map((issue, index) => (
                    <li key={`${issue.line}-${issue.code}-${index}`} className="rounded-md bg-amber-500/10 p-2 text-amber-800 dark:text-amber-200">
                      {t(`issues.${issue.code}`, { line: issue.line })}: {issue.source}
                      {issue.candidates.length ? ` (${issue.candidates.map((item) => item.name).join(", ")})` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button
                type="button"
                onClick={() => {
                  onApply(result);
                  setExpanded(false);
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
      ) : null}
    </section>
  );
}
