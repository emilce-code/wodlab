"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

const steps = [
  "movement",
  "workout",
  "section",
  "variation",
  "prescription",
] as const;
type Step = (typeof steps)[number];

const stepStyles: Record<
  Step,
  {
    text: string;
    border: string;
    background: string;
    solid: string;
    glow: string;
  }
> = {
  movement: {
    text: "text-lime-400",
    border: "border-lime-400/45",
    background: "bg-lime-400/10",
    solid: "bg-lime-400",
    glow: "shadow-lime-400/15",
  },
  workout: {
    text: "text-teal-300",
    border: "border-teal-300/45",
    background: "bg-teal-300/10",
    solid: "bg-teal-300",
    glow: "shadow-teal-300/15",
  },
  section: {
    text: "text-purple-400",
    border: "border-purple-400/45",
    background: "bg-purple-400/10",
    solid: "bg-purple-400",
    glow: "shadow-purple-400/15",
  },
  variation: {
    text: "text-orange-400",
    border: "border-orange-400/45",
    background: "bg-orange-400/10",
    solid: "bg-orange-400",
    glow: "shadow-orange-400/15",
  },
  prescription: {
    text: "text-pink-400",
    border: "border-pink-400/45",
    background: "bg-pink-400/10",
    solid: "bg-pink-400",
    glow: "shadow-pink-400/15",
  },
};

function ConceptIcon({
  concept,
  className = "h-6 w-6",
}: {
  concept: Step;
  className?: string;
}) {
  const paths: Record<Step, React.ReactNode> = {
    movement: (
      <>
        <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />
      </>
    ),
    workout: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    section: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
      </>
    ),
    variation: (
      <>
        <circle cx="6" cy="5" r="2" />
        <circle cx="18" cy="5" r="2" />
        <circle cx="12" cy="19" r="2" />
        <path d="M7.5 6.5 11 17M16.5 6.5 13 17M8 5h8" />
      </>
    ),
    prescription: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
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
      className={className}
    >
      {paths[concept]}
    </svg>
  );
}

function MovementExample() {
  const t = useTranslations("help.visualGuide");
  return (
    <div className="rounded-2xl border border-lime-400/25 bg-black/15 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400 text-slate-950">
          <ConceptIcon concept="movement" />
        </span>
        <span>
          <span className="block text-xs text-muted">
            {t("examples.movement.label")}
          </span>
          <span className="block text-lg font-black">
            {t("examples.movement.name")}
          </span>
        </span>
      </div>
      <div className="my-5 flex h-28 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400/5 to-lime-400/15 text-lime-400">
        <ConceptIcon concept="movement" className="h-20 w-20" />
      </div>
      <p className="text-sm leading-6 text-muted">
        {t("examples.movement.detail")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {["strength", "barbell", "fullBody"].map((key) => (
          <span
            key={key}
            className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-semibold text-muted"
          >
            {t(`examples.movement.tags.${key}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

function WorkoutExample() {
  const t = useTranslations("help.visualGuide");
  return (
    <div className="rounded-2xl border border-teal-300/25 bg-black/15 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-300 text-slate-950">
          <ConceptIcon concept="workout" />
        </span>
        <span>
          <span className="block text-xs text-muted">
            {t("examples.workout.label")}
          </span>
          <span className="block text-lg font-black">
            {t("examples.workout.name")}
          </span>
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        {t("examples.workout.detail")}
      </p>
      <div className="mt-4 space-y-2">
        {(["thruster", "pullUp", "run"] as const).map((key) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface/70 px-3 py-2.5"
          >
            <ConceptIcon concept="movement" className="h-5 w-5 text-muted" />
            <span className="text-sm font-semibold">
              {t(`examples.workout.movements.${key}`)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        {t("examples.workout.more")}
      </p>
    </div>
  );
}

function SectionExample() {
  const t = useTranslations("help.visualGuide");
  const sectionRows = [
    ["warmup", "bg-rose-500/15 text-rose-300 border-rose-500/25"],
    ["strength", "bg-purple-500/15 text-purple-300 border-purple-500/25"],
    ["wod", "bg-orange-500/15 text-orange-300 border-orange-500/25"],
    ["cooldown", "bg-cyan-500/15 text-cyan-300 border-cyan-500/25"],
  ] as const;
  return (
    <div className="rounded-2xl border border-purple-400/25 bg-black/15 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-400 text-slate-950">
          <ConceptIcon concept="workout" />
        </span>
        <span className="text-lg font-black">
          {t("examples.section.workoutName")}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {sectionRows.map(([key, classes], index) => (
          <div
            key={key}
            className={`flex items-center justify-between rounded-xl border px-3 py-3 ${classes}`}
          >
            <span className="flex items-center gap-3">
              <span className="text-xs font-black">{index + 1}</span>
              <span className="font-semibold">
                {t(`examples.section.sections.${key}`)}
              </span>
            </span>
            <span aria-hidden="true">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariationExample() {
  const t = useTranslations("help.visualGuide");
  const variations = [
    ["rx", "bg-purple-500/15 text-purple-300 border-purple-500/25"],
    ["intermediate", "bg-sky-500/15 text-sky-300 border-sky-500/25"],
    ["beginner", "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"],
  ] as const;
  return (
    <div className="rounded-2xl border border-orange-400/25 bg-black/15 p-4">
      <div className="flex items-center gap-3 rounded-xl border border-orange-400/25 bg-orange-400/10 p-3">
        <span className="text-2xl text-orange-400">⚡</span>
        <span>
          <span className="block font-black">
            {t("examples.variation.section")}
          </span>
          <span className="block text-xs text-muted">
            {t("examples.variation.scheme")}
          </span>
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {variations.map(([key, classes]) => (
          <div
            key={key}
            className={`flex items-center justify-between rounded-xl border px-3 py-3 ${classes}`}
          >
            <span>
              <span className="block font-bold">
                {t(`examples.variation.levels.${key}.name`)}
              </span>
              <span className="block text-xs opacity-80">
                {t(`examples.variation.levels.${key}.description`)}
              </span>
            </span>
            <span aria-hidden="true">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrescriptionExample() {
  const t = useTranslations("help.visualGuide");
  return (
    <div className="rounded-2xl border border-pink-400/25 bg-black/15 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/30 text-purple-300">
          ♛
        </span>
        <span>
          <span className="block text-lg font-black">
            {t("examples.prescription.title")}
          </span>
          <span className="block text-xs text-muted">
            {t("examples.prescription.scheme")}
          </span>
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-sky-500/35 bg-sky-500/10 p-3 text-sky-300">
          <p className="text-xs font-bold">
            ♂ {t("examples.prescription.men")}
          </p>
          <p className="mt-4 text-2xl font-black text-foreground">43 kg</p>
          <p className="mt-1 text-xs text-muted">21 · 15 · 9 reps</p>
        </div>
        <div className="rounded-xl border border-pink-500/35 bg-pink-500/10 p-3 text-pink-300">
          <p className="text-xs font-bold">
            ♀ {t("examples.prescription.women")}
          </p>
          <p className="mt-4 text-2xl font-black text-foreground">29 kg</p>
          <p className="mt-1 text-xs text-muted">21 · 15 · 9 reps</p>
        </div>
      </div>
      <p className="mt-4 rounded-xl bg-surface-elevated/70 px-3 py-2.5 text-center text-xs leading-5 text-muted">
        {t("examples.prescription.note")}
      </p>
    </div>
  );
}

function StepExample({ step }: { step: Step }) {
  switch (step) {
    case "movement":
      return <MovementExample />;
    case "workout":
      return <WorkoutExample />;
    case "section":
      return <SectionExample />;
    case "variation":
      return <VariationExample />;
    case "prescription":
      return <PrescriptionExample />;
  }
}

function JourneyMap({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("help.visualGuide");
  const hierarchy = [
    "workout",
    "variation",
    "section",
    "movement",
    "prescription",
  ] as const;

  function isActive(step: Step) {
    return steps[activeIndex] === step;
  }

  function hierarchyCard(step: Step, content: React.ReactNode, className = "") {
    const index = steps.indexOf(step);
    const style = stepStyles[step];
    return (
      <button
        type="button"
        onClick={() => onSelect(index)}
        aria-current={isActive(step) ? "step" : undefined}
        className={`min-h-14 w-full min-w-0 rounded-xl border p-2.5 text-left transition hover:brightness-110 sm:p-3 ${style.border} ${style.background} ${isActive(step) ? "ring-2 ring-current/20" : ""} ${className}`}
      >
        <span className="flex items-center gap-2">
          <ConceptIcon
            concept={step}
            className={`h-5 w-5 shrink-0 ${style.text}`}
          />
          <span className="min-w-0">
            <span
              className={`block text-[10px] font-black uppercase tracking-[0.14em] ${style.text}`}
            >
              {t(`steps.${step}.shortTitle`)}
            </span>
            <span className="block break-words text-sm font-bold leading-5 text-foreground">
              {content}
            </span>
          </span>
        </span>
      </button>
    );
  }

  return (
    <section
      aria-labelledby="journey-map-title"
      className="rounded-2xl border border-border bg-surface/80 p-4 sm:p-5"
    >
      <div>
        <div>
          <h3 id="journey-map-title" className="font-black">
            {t("bigPicture.title")}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {t("bigPicture.description")}
          </p>
        </div>
        <div className="mt-5 xl:hidden">
          {hierarchyCard("workout", t("bigPicture.values.workout"))}
          <div className="ml-2 border-l border-dashed border-teal-300/40 pl-2 pt-3 sm:ml-4 sm:pl-3">
            {hierarchyCard("variation", t("bigPicture.values.variation"))}
            <div className="mt-2 flex flex-wrap gap-2 pl-2 text-[10px] font-semibold text-muted">
              <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-1">
                {t("examples.variation.levels.intermediate.name")}
              </span>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1">
                {t("examples.variation.levels.beginner.name")}
              </span>
            </div>
            <div className="ml-2 border-l border-dashed border-orange-400/40 pl-2 pt-3 sm:ml-4 sm:pl-3">
              {hierarchyCard("section", t("bigPicture.values.section"))}
              <div className="mt-2 flex flex-wrap gap-2 pl-2 text-[10px] font-semibold text-muted">
                <span>{t("examples.section.sections.warmup")}</span>
                <span>·</span>
                <span>{t("examples.section.sections.strength")}</span>
                <span>·</span>
                <span>{t("examples.section.sections.cooldown")}</span>
              </div>
              <div className="ml-2 border-l border-dashed border-purple-400/40 pl-2 pt-3 sm:ml-4 sm:pl-3">
                {hierarchyCard("movement", t("bigPicture.values.movement"))}
                <div className="ml-2 border-l border-dashed border-lime-400/40 pl-2 pt-3 sm:ml-4 sm:pl-3">
                  {hierarchyCard(
                    "prescription",
                    <span className="flex flex-wrap gap-x-3 gap-y-1">
                      <span className="text-sky-300">♂ 43 kg</span>
                      <span className="text-pink-300">♀ 29 kg</span>
                    </span>,
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ol className="mt-5 hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 xl:grid">
          {hierarchy.map((step, index) => (
            <li key={step} className="contents">
              <div className="min-w-0">
                {step === "variation" ? (
                  <div className="space-y-2">
                    {hierarchyCard(step, t("bigPicture.values.variation"))}
                    <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-2 py-1.5 text-[10px] font-semibold text-sky-300">
                      {t("examples.variation.levels.intermediate.name")}
                    </div>
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2 py-1.5 text-[10px] font-semibold text-emerald-300">
                      {t("examples.variation.levels.beginner.name")}
                    </div>
                  </div>
                ) : step === "section" ? (
                  <div className="space-y-2">
                    {hierarchyCard(step, t("bigPicture.values.section"))}
                    <p className="px-1 text-[10px] leading-4 text-muted">
                      {t("examples.section.sections.warmup")} ·{" "}
                      {t("examples.section.sections.strength")} ·{" "}
                      {t("examples.section.sections.cooldown")}
                    </p>
                  </div>
                ) : step === "prescription" ? (
                  hierarchyCard(
                    step,
                    <span>
                      <span className="text-sky-300">♂ 43 kg</span>
                      <span className="mx-1 text-muted">·</span>
                      <span className="text-pink-300">♀ 29 kg</span>
                    </span>,
                  )
                ) : (
                  hierarchyCard(step, t(`bigPicture.values.${step}`))
                )}
              </div>
              {index < hierarchy.length - 1 ? (
                <span aria-hidden="true" className="text-lg text-muted">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function HelpGuide() {
  const t = useTranslations("help.visualGuide");
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = steps[activeIndex];
  const style = stepStyles[activeStep];

  function selectStep(index: number) {
    setActiveIndex(index);
    document
      .getElementById("visual-guide-card")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-6 space-y-5 sm:mt-8">
      <section
        id="visual-guide-card"
        aria-labelledby="visual-guide-title"
        className={`scroll-mt-5 overflow-hidden rounded-3xl border bg-surface shadow-2xl ${style.border} ${style.glow}`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <p className={`text-sm font-black ${style.text}`}>
              <span className="text-xl">{activeIndex + 1}</span>
              <span className="text-muted"> / {steps.length}</span>
            </p>
            <button
              type="button"
              onClick={() => selectStep(steps.length - 1)}
              className="min-h-11 px-2 text-sm font-semibold text-muted transition hover:text-foreground"
            >
              {t("skip")}
            </button>
          </div>
          <div
            className="mt-2 flex items-center gap-2"
            aria-label={t("progressLabel")}
          >
            {steps.map((step, index) => (
              <button
                key={step}
                type="button"
                onClick={() => selectStep(index)}
                aria-label={t("goToStep", { step: index + 1 })}
                aria-current={activeIndex === index ? "step" : undefined}
                className="flex min-h-6 flex-1 items-center"
              >
                <span
                  className={`h-1.5 w-full rounded-full transition ${index === activeIndex ? stepStyles[step].solid : index < activeIndex ? "bg-muted/60" : "bg-border"}`}
                />
              </button>
            ))}
          </div>
          <div className="mt-7 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-base text-muted">
                {t(`steps.${activeStep}.lead`)}
              </p>
              <h2
                id="visual-guide-title"
                className={`mt-1 text-4xl font-black tracking-tight sm:text-5xl ${style.text}`}
              >
                {t(`steps.${activeStep}.title`)}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-foreground/85">
                {t(`steps.${activeStep}.description`)}
              </p>
              <div
                className={`mt-6 rounded-2xl border p-4 ${style.border} ${style.background}`}
              >
                <div className="flex gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.solid} text-slate-950`}
                  >
                    ◇
                  </span>
                  <p className="text-sm leading-6">
                    {t(`steps.${activeStep}.insight`)}
                  </p>
                </div>
              </div>
            </div>
            <StepExample step={activeStep} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => selectStep(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="min-h-11 rounded-xl px-3 text-sm font-semibold text-muted transition hover:text-foreground disabled:invisible"
          >
            ← {t("back")}
          </button>
          {activeIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => selectStep(activeIndex + 1)}
              className={`min-h-12 rounded-xl px-6 text-sm font-black text-slate-950 transition hover:brightness-110 ${style.solid}`}
            >
              {t("next")} →
            </button>
          ) : (
            <Link
              href="/workouts/new"
              className={`inline-flex min-h-12 items-center rounded-xl px-6 text-sm font-black text-slate-950 transition hover:brightness-110 ${style.solid}`}
            >
              {t("finish")} →
            </Link>
          )}
        </div>
      </section>
      <JourneyMap activeIndex={activeIndex} onSelect={selectStep} />
    </div>
  );
}
