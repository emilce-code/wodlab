"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

const steps = [
  "workout",
  "variation",
  "target",
  "performance",
  "progress",
] as const;
type LogStep = (typeof steps)[number];

const accents: Record<LogStep, string> = {
  workout: "bg-lime-400 text-slate-950",
  variation: "bg-orange-400 text-slate-950",
  target: "bg-pink-400 text-slate-950",
  performance: "bg-lime-400 text-slate-950",
  progress: "bg-purple-400 text-slate-950",
};

function WorkoutPicker() {
  const t = useTranslations("help.logResultsGuide.example");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 rounded-xl bg-surface-elevated p-1 text-center text-[11px] font-semibold text-muted">
        <span className="rounded-lg bg-lime-400/15 py-2 text-lime-300">{t("forYou")}</span>
        <span className="py-2">{t("yourWorkouts")}</span>
        <span className="py-2">{t("history")}</span>
      </div>
      <p className="text-xs font-bold text-muted">{t("today")}</p>
      <div className="flex items-center gap-3 rounded-xl border-2 border-lime-400 bg-lime-400/5 p-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/15 text-xl">⚡</span>
        <span className="min-w-0 flex-1">
          <span className="block font-black">{t("workoutName")}</span>
          <span className="block text-xs text-muted">{t("workoutMeta")}</span>
        </span>
        <span className="text-lime-400">›</span>
      </div>
      {["upperBody", "conditioning", "olympicLifting"].map((key) => (
        <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated/50 px-3 py-3 text-sm font-semibold">
          <span>{t(key)}</span><span className="text-muted">›</span>
        </div>
      ))}
    </div>
  );
}

function VariationPicker() {
  const t = useTranslations("help.logResultsGuide.example");
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/15 text-xl">⚡</span>
        <span><span className="block font-black">{t("workoutName")}</span><span className="text-xs text-muted">{t("date")}</span></span>
      </div>
      <div className="space-y-2">
        {(["rx", "intermediate", "beginner"] as const).map((key, index) => (
          <div key={key} className={`flex items-center gap-3 rounded-xl border p-3 ${index === 0 ? "border-lime-400 bg-lime-400/5" : "border-border bg-surface-elevated/50"}`}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${index === 0 ? "bg-purple-500/25 text-purple-300" : index === 1 ? "bg-sky-500/20 text-sky-300" : "bg-emerald-500/20 text-emerald-300"}`}>♛</span>
            <span className="min-w-0 flex-1"><span className="block font-bold">{t(`variations.${key}.name`)}</span><span className="block text-xs text-muted">{t(`variations.${key}.description`)}</span></span>
            <span className={`h-5 w-5 rounded-full border ${index === 0 ? "border-lime-400 bg-lime-400 shadow-[inset_0_0_0_4px_#15200d]" : "border-muted"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TargetReview() {
  const t = useTranslations("help.logResultsGuide.example");
  return (
    <div>
      <div className="mb-3 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/25 text-purple-300">♛</span><span><span className="block font-black">{t("workoutName")}</span><span className="text-xs text-muted">Rx · {t("sectionsCount")}</span></span></div>
      <div className="space-y-2">
        {(["warmup", "strength", "wod", "cooldown"] as const).map((key) => (
          <div key={key} className={`rounded-xl border p-3 ${key === "wod" ? "border-lime-400 bg-lime-400/5" : "border-border bg-surface-elevated/50"}`}>
            <div className="flex items-center justify-between"><span className="font-bold">{t(`sections.${key}`)}</span><span className="text-muted">›</span></div>
            {key === "wod" ? <p className="mt-1 text-xs text-muted">21 – 15 – 9 · {t("twoMovements")}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceForm() {
  const t = useTranslations("help.logResultsGuide.example");
  return (
    <div>
      <div className="mb-3 flex items-center gap-3"><span className="text-2xl">⚡</span><span><span className="block font-black">WOD</span><span className="text-xs text-muted">Rx · 21 – 15 – 9</span></span></div>
      <div className="rounded-xl border border-border bg-surface-elevated/40 p-3">
        <div className="flex items-center justify-between font-bold"><span>1. Thruster</span><span>⌃</span></div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-sky-500/10 p-2"><span className="text-sky-300">♂ {t("men")}</span><strong className="mt-1 block text-foreground">43 kg</strong></div><div className="rounded-lg bg-pink-500/10 p-2"><span className="text-pink-300">♀ {t("women")}</span><strong className="mt-1 block text-foreground">29 kg</strong></div></div>
        <p className="mt-3 text-xs font-bold text-lime-300">{t("yourResult")}</p>
        <div className="mt-2 grid grid-cols-2 gap-2"><span className="rounded-lg border border-lime-400 bg-lime-400/10 px-3 py-2 font-bold">27.5 kg</span><span className="rounded-lg border border-border px-3 py-2 font-bold">21 – 15 – 9</span></div>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-surface-elevated/40 p-3 font-bold"><span>2. Pull-up</span><span>⌄</span></div>
    </div>
  );
}

function SavedResult() {
  const t = useTranslations("help.logResultsGuide.example");
  return (
    <div className="text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-400 text-2xl font-black text-slate-950">✓</span>
      <h3 className="mt-3 text-xl font-black">{t("saved")}</h3>
      <p className="mt-1 text-xs text-muted">{t("savedDescription")}</p>
      <div className="mt-5 rounded-xl border border-border bg-surface-elevated/50 p-4 text-left">
        <div className="flex items-center gap-3 border-b border-border pb-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/15">⚡</span><span><strong className="block">{t("workoutName")}</strong><span className="text-xs text-muted">Rx · {t("date")}</span></span></div>
        <dl className="mt-3 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-muted">{t("totalTime")}</dt><dd className="font-black">8:42</dd></div><div className="flex justify-between"><dt className="text-muted">{t("movements")}</dt><dd className="font-black">2 / 2</dd></div></dl>
      </div>
      <div className="mt-4 rounded-xl bg-lime-400 px-4 py-3 text-sm font-black text-slate-950">{t("viewHistory")}</div>
    </div>
  );
}

function StepScreen({ step }: { step: LogStep }) {
  if (step === "workout") return <WorkoutPicker />;
  if (step === "variation") return <VariationPicker />;
  if (step === "target") return <TargetReview />;
  if (step === "performance") return <PerformanceForm />;
  return <SavedResult />;
}

export default function LogResultsGuide() {
  const t = useTranslations("help.logResultsGuide");
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = steps[activeIndex];

  function selectStep(index: number) {
    setActiveIndex(index);
    document.getElementById("log-results-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="log-results-guide" aria-labelledby="log-results-title" className="scroll-mt-5 overflow-hidden rounded-3xl border border-lime-400/35 bg-surface shadow-2xl shadow-lime-400/5">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4"><p className="text-sm font-black text-lime-300"><span className="text-xl">{activeIndex + 1}</span><span className="text-muted"> / {steps.length}</span></p><button type="button" onClick={() => selectStep(steps.length - 1)} className="min-h-11 px-2 text-sm font-semibold text-muted hover:text-foreground">{t("skip")}</button></div>
        <div className="mt-2 flex gap-2" aria-label={t("progressLabel")}>
          {steps.map((step, index) => <button key={step} type="button" onClick={() => selectStep(index)} aria-label={t("goToStep", { step: index + 1 })} aria-current={activeIndex === index ? "step" : undefined} className="flex min-h-6 flex-1 items-center"><span className={`h-1.5 w-full rounded-full ${index === activeIndex ? accents[step].split(" ")[0] : index < activeIndex ? "bg-muted/60" : "bg-border"}`} /></button>)}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-lime-300">{t("eyebrow")}</p>
            <h2 id="log-results-title" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{t(`steps.${activeStep}.title`)}</h2>
            <p className="mt-3 text-base leading-7 text-muted">{t(`steps.${activeStep}.description`)}</p>
            <div className="mt-5 rounded-2xl border border-lime-400/25 bg-lime-400/5 p-4"><p className="text-sm leading-6"><span className="mr-2 text-lime-300">◇</span>{t(`steps.${activeStep}.tip`)}</p></div>
          </div>
          <div className="mx-auto w-full max-w-md rounded-[2rem] border border-border bg-black/20 p-3 shadow-xl"><div className="min-h-[390px] rounded-[1.4rem] border border-border bg-surface p-4 sm:p-5"><StepScreen step={activeStep} /></div></div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-6">
        <button type="button" onClick={() => selectStep(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-muted hover:text-foreground disabled:invisible">← {t("back")}</button>
        {activeIndex < steps.length - 1 ? <button type="button" onClick={() => selectStep(activeIndex + 1)} className={`min-h-12 rounded-xl px-6 text-sm font-black transition hover:brightness-110 ${accents[activeStep]}`}>{t("next")} →</button> : <Link href="/workouts" className="inline-flex min-h-12 items-center rounded-xl bg-purple-400 px-6 text-sm font-black text-slate-950 hover:brightness-110">{t("finish")} →</Link>}
      </div>
    </section>
  );
}
