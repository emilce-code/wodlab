"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const lessonKeys = [
  "movement",
  "workout",
  "variation",
  "section",
  "prescription",
] as const;
type LessonKey = (typeof lessonKeys)[number];
const movementExamples = ["backSquat", "row", "pullUp"] as const;
const moreGuideKeys = ["results", "progress", "training", "coaching"] as const;

function ConceptIcon({ concept }: { concept: LessonKey }) {
  const paths: Record<LessonKey, React.ReactNode> = {
    movement: <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />,
    workout: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    variation: (
      <>
        <path d="M6 4v12a4 4 0 0 0 4 4h12" />
        <path d="m17 16 4 4-4 4M6 9h10l3-3M16 3l3 3-3 3" />
      </>
    ),
    section: (
      <>
        <rect x="3" y="4" width="18" height="6" rx="2" />
        <rect x="3" y="14" width="18" height="6" rx="2" />
      </>
    ),
    prescription: (
      <>
        <path d="M5 4h14v16H5zM8 8h8M8 12h5" />
        <path d="m14 16 2 2 4-5" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      {paths[concept]}
    </svg>
  );
}

function WorkoutConceptGraphic({ activeIndex }: { activeIndex: number }) {
  const t = useTranslations("help.learning.graphic");
  const showWorkout = activeIndex >= 1;
  const showVariation = activeIndex >= 2;
  const showSection = activeIndex >= 3;
  const showPrescription = activeIndex >= 4;

  let graphic: React.ReactNode = (
    <div
      className={`rounded-xl border border-emerald-500/30 bg-emerald-500/[0.035] p-3 transition-all ${activeIndex === 0 ? "ring-2 ring-emerald-500/30" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15">
            M1
          </span>
          {t("movement")}
        </span>
        <span className="text-xs text-muted">{t("measurement")}</span>
      </div>
      <p className="mt-2 font-bold">{t("movementName")}</p>
      {showPrescription ? (
        <div className="mt-3 rounded-lg border border-dashed border-accent bg-accent/10 px-3 py-2 ring-2 ring-accent/20">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
            {t("prescription")}
          </p>
          <p className="mt-1 text-sm font-semibold">{t("prescriptionValue")}</p>
        </div>
      ) : null}
    </div>
  );

  if (showSection) {
    graphic = (
      <div
        className={`rounded-xl border border-sky-500/30 bg-sky-500/[0.035] p-3 transition-all ${activeIndex === 3 ? "ring-2 ring-sky-500/30" : ""}`}
      >
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15">
            S1
          </span>
          {t("section")}
        </span>
        <p className="mb-3 mt-1 text-sm font-semibold">{t("sectionName")}</p>
        {graphic}
      </div>
    );
  }

  if (showVariation) {
    graphic = (
      <div
        className={`rounded-2xl border border-accent/35 bg-accent/[0.035] p-3 transition-all ${activeIndex === 2 ? "ring-2 ring-accent/25" : ""}`}
      >
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-accent">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
            V1
          </span>
          {t("variation")}
        </span>
        <p className="mb-3 mt-1 text-sm font-semibold">{t("variationName")}</p>
        {graphic}
      </div>
    );
  }

  if (showWorkout) {
    graphic = (
      <div
        className={`rounded-2xl border border-border bg-surface p-3 shadow-sm transition-all ${activeIndex === 1 ? "ring-2 ring-foreground/10" : ""}`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
            {t("workout")}
          </span>
          <span className="rounded-full bg-surface-elevated px-2.5 py-1 text-[10px] font-bold text-muted">
            {t("workoutType")}
          </span>
        </div>
        <p className="mb-3 mt-1 font-black">{t("workoutName")}</p>
        {graphic}
      </div>
    );
  }

  return (
    <figure>
      <div className="rounded-2xl bg-background p-3 sm:p-4">{graphic}</div>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-foreground/40 bg-surface" />
          {t("legendWorkout")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          {t("legendVariation")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
          {t("legendSection")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          {t("legendMovement")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-accent bg-accent/10" />
          {t("legendPrescription")}
        </span>
      </figcaption>
    </figure>
  );
}

function MovementExample() {
  const t = useTranslations("help.learning");
  const [movement, setMovement] =
    useState<(typeof movementExamples)[number]>("backSquat");

  return (
    <div>
      <div
        className="grid grid-cols-3 gap-2"
        role="group"
        aria-label={t("movement.tryLabel")}
      >
        {movementExamples.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setMovement(key)}
            aria-pressed={movement === key}
            className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-semibold transition ${movement === key ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-muted hover:text-foreground"}`}
          >
            {t(`movement.examples.${key}.name`)}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-2xl border border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <ConceptIcon concept="movement" />
          </div>
          <div className="min-w-0">
            <p className="font-bold">
              {t(`movement.examples.${movement}.name`)}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {t(`movement.examples.${movement}.description`)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-semibold">
            {t(`movement.examples.${movement}.category`)}
          </span>
          <span className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-semibold">
            {t(`movement.examples.${movement}.measurement`)}
          </span>
        </div>
      </div>
    </div>
  );
}

function WorkoutExample() {
  const t = useTranslations("help.learning");
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {t("workout.example.type")}
          </p>
          <p className="mt-1 text-lg font-bold">{t("workout.example.name")}</p>
        </div>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
          {t("workout.example.score")}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {(["backSquat", "row", "pullUp"] as const).map((movement, index) => (
          <div
            key={movement}
            className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
              {index + 1}
            </span>
            <span className="text-sm font-semibold">
              {t(`workout.example.movements.${movement}`)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">
        {t("workout.example.note")}
      </p>
    </div>
  );
}

function VariationExample() {
  const t = useTranslations("help.learning");
  const [level, setLevel] = useState<"rx" | "beginner">("rx");
  return (
    <div>
      <div
        className="grid grid-cols-2 rounded-xl bg-background p-1"
        role="group"
        aria-label={t("variation.tryLabel")}
      >
        {(["rx", "beginner"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setLevel(key)}
            aria-pressed={level === key}
            className={`min-h-11 rounded-lg px-3 text-sm font-bold transition ${level === key ? "bg-accent text-accent-foreground" : "text-muted"}`}
          >
            {t(`variation.levels.${key}.name`)}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-2xl border border-border bg-background p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          {t("variation.exampleTitle", {
            level: t(`variation.levels.${level}.name`),
          })}
        </p>
        <div className="mt-3 space-y-2 text-sm">
          <p className="rounded-xl bg-surface px-3 py-2.5 font-semibold">
            {t(`variation.levels.${level}.movementOne`)}
          </p>
          <p className="rounded-xl bg-surface px-3 py-2.5 font-semibold">
            {t(`variation.levels.${level}.movementTwo`)}
          </p>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          {t(`variation.levels.${level}.stimulus`)}
        </p>
      </div>
    </div>
  );
}

function SectionExample() {
  const t = useTranslations("help.learning");
  const [active, setActive] = useState<"strength" | "conditioning">("strength");
  return (
    <div className="space-y-3">
      {(["strength", "conditioning"] as const).map((key, index) => (
        <button
          key={key}
          type="button"
          onClick={() => setActive(key)}
          aria-pressed={active === key}
          className={`w-full rounded-2xl border p-4 text-left transition ${active === key ? "border-accent bg-accent/10" : "border-border bg-background"}`}
        >
          <span className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${active === key ? "bg-accent text-accent-foreground" : "bg-surface-elevated text-muted"}`}
            >
              {index + 1}
            </span>
            <span>
              <span className="block text-sm font-bold">
                {t(`section.examples.${key}.name`)}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {t(`section.examples.${key}.content`)}
              </span>
            </span>
          </span>
          {active === key ? (
            <span className="mt-3 block border-t border-accent/20 pt-3 text-xs leading-5 text-muted">
              {t(`section.examples.${key}.purpose`)}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function PrescriptionExample() {
  const t = useTranslations("help.learning");
  const [category, setCategory] = useState<"men" | "women">("men");
  return (
    <div>
      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {t("prescription.genericLabel")}
        </p>
        <p className="mt-2 text-lg font-black">
          {t("prescription.genericValue")}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">
          {t("prescription.genericHelp")}
        </p>
      </div>
      <div className="relative my-2 ml-6 h-5 border-l-2 border-dashed border-accent/40" />
      <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {t("prescription.categoryLabel")}
          </p>
          <div
            className="flex rounded-lg bg-background p-1"
            role="group"
            aria-label={t("prescription.tryLabel")}
          >
            {(["men", "women"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                aria-pressed={category === key}
                className={`min-h-9 rounded-md px-3 text-xs font-bold transition ${category === key ? "bg-accent text-accent-foreground" : "text-muted"}`}
              >
                {t(`prescription.categories.${key}.name`)}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-lg font-black">
          {t(`prescription.categories.${category}.value`)}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">
          {t("prescription.categoryHelp")}
        </p>
      </div>
    </div>
  );
}

function LessonExample({ lesson }: { lesson: LessonKey }) {
  switch (lesson) {
    case "movement":
      return <MovementExample />;
    case "workout":
      return <WorkoutExample />;
    case "variation":
      return <VariationExample />;
    case "section":
      return <SectionExample />;
    case "prescription":
      return <PrescriptionExample />;
  }
}

export default function HelpGuide() {
  const t = useTranslations("help");
  const [activeIndex, setActiveIndex] = useState(0);
  const activeLesson = lessonKeys[activeIndex];

  function selectLesson(index: number) {
    setActiveIndex(index);
    document
      .getElementById("concept-lesson")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-6 space-y-8 sm:mt-8">
      <section aria-labelledby="learning-path-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {t("learning.eyebrow")}
            </p>
            <h2
              id="learning-path-title"
              className="mt-1 text-xl font-bold sm:text-2xl"
            >
              {t("learning.title")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              {t("learning.description")}
            </p>
          </div>
          <span className="shrink-0 text-sm font-bold text-accent">
            {t("learning.progress", {
              current: activeIndex + 1,
              total: lessonKeys.length,
            })}
          </span>
        </div>
        <div className="mt-5 overflow-x-auto pb-2">
          <ol className="flex min-w-max items-center gap-2">
            {lessonKeys.map((key, index) => (
              <li key={key} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectLesson(index)}
                  aria-current={index === activeIndex ? "step" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition ${index === activeIndex ? "border-accent bg-accent text-accent-foreground" : index < activeIndex ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-muted"}`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/20 text-xs font-black">
                    {index < activeIndex ? "✓" : index + 1}
                  </span>
                  {t(`learning.steps.${key}.shortTitle`)}
                </button>
                {index < lessonKeys.length - 1 ? (
                  <span aria-hidden="true" className="text-border">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <article
          id="concept-lesson"
          className="scroll-mt-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
        >
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="p-5 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <ConceptIcon concept={activeLesson} />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {t("learning.stepLabel", { number: activeIndex + 1 })}
              </p>
              <h3 className="mt-1 text-2xl font-black">
                {t(`learning.steps.${activeLesson}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                {t(`learning.steps.${activeLesson}.description`)}
              </p>
              <div className="mt-5 rounded-xl border-l-4 border-accent bg-accent/5 px-4 py-3">
                <p className="text-sm font-semibold">
                  {t(`learning.steps.${activeLesson}.keyPoint`)}
                </p>
              </div>
            </div>
            <div className="border-t border-border bg-surface-elevated/50 p-4 sm:p-6 lg:border-l lg:border-t-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t("learning.graphicTitle")}
              </p>
              <WorkoutConceptGraphic activeIndex={activeIndex} />
              <p className="mb-3 mt-6 border-t border-border pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t("learning.tryIt")}
              </p>
              <LessonExample lesson={activeLesson} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border p-4 sm:px-7">
            <button
              type="button"
              onClick={() => selectLesson(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-surface-elevated disabled:invisible"
            >
              ← {t("learning.previous")}
            </button>
            {activeIndex < lessonKeys.length - 1 ? (
              <button
                type="button"
                onClick={() => selectLesson(activeIndex + 1)}
                className="min-h-11 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground transition hover:bg-accent-strong"
              >
                {t("learning.next", {
                  concept: t(
                    `learning.steps.${lessonKeys[activeIndex + 1]}.shortTitle`,
                  ),
                })}{" "}
                →
              </button>
            ) : (
              <span className="text-sm font-bold text-accent">
                ✓ {t("learning.complete")}
              </span>
            )}
          </div>
        </article>
      </section>
      <section aria-labelledby="more-guides-title">
        <h2 id="more-guides-title" className="text-xl font-bold">
          {t("moreGuidesTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("moreGuidesDescription")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {moreGuideKeys.map((key) => (
            <details
              key={key}
              className="group rounded-xl border border-border bg-surface"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
                <span>
                  <span className="block text-sm font-semibold">
                    {t(`guides.${key}.title`)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {t(`guides.${key}.summary`)}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-xl text-muted transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="border-t border-border px-4 py-4 text-sm leading-6 text-muted">
                {t(`guides.${key}.body`)}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
