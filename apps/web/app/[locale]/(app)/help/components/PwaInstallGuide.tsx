"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type InstallGuideKind = "ios" | "android-chrome" | "xiaomi" | "android-other";

type InstallGuide = {
  key: InstallGuideKind;
  title: string;
  description: string;
  steps: string[];
};

export default function PwaInstallGuide() {
  const t = useTranslations("pwa");
  const [guideKind, setGuideKind] = useState<InstallGuideKind>("ios");
  const installGuides: InstallGuide[] = [
    {
      key: "ios",
      title: t("guide.ios.title"),
      description: t("guide.ios.description"),
      steps: [
        t("guide.ios.step1"),
        t("guide.ios.step2"),
        t("guide.ios.step3"),
      ],
    },
    {
      key: "android-chrome",
      title: t("guide.androidChrome.title"),
      description: t("guide.androidChrome.description"),
      steps: [
        t("guide.androidChrome.step1"),
        t("guide.androidChrome.step2"),
        t("guide.androidChrome.step3"),
      ],
    },
    {
      key: "xiaomi",
      title: t("guide.xiaomi.title"),
      description: t("guide.xiaomi.description"),
      steps: [
        t("guide.xiaomi.step1"),
        t("guide.xiaomi.step2"),
        t("guide.xiaomi.step3"),
      ],
    },
    {
      key: "android-other",
      title: t("guide.androidOther.title"),
      description: t("guide.androidOther.description"),
      steps: [
        t("guide.androidOther.step1"),
        t("guide.androidOther.step2"),
        t("guide.androidOther.step3"),
      ],
    },
  ];
  const selectedGuide =
    installGuides.find((guide) => guide.key === guideKind) ?? installGuides[0];

  return (
    <section
      aria-labelledby="pwa-install-guide-title"
      className="overflow-hidden rounded-3xl border border-lime-400/35 bg-surface shadow-2xl shadow-lime-400/5"
    >
      <div className="p-4 sm:p-6">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-lime-300">
          {t("guide.eyebrow")}
        </p>
        <h2
          id="pwa-install-guide-title"
          className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
        >
          {t("guide.title")}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          {t("installDescription")}
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div
            role="tablist"
            aria-label={t("guide.deviceTabs")}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"
          >
            {installGuides.map((guide) => (
              <button
                key={guide.key}
                type="button"
                role="tab"
                aria-selected={guide.key === guideKind}
                onClick={() => setGuideKind(guide.key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  guide.key === guideKind
                    ? "border-lime-400/60 bg-lime-400 text-slate-950"
                    : "border-border bg-surface-elevated hover:border-lime-400/35"
                }`}
              >
                <span className="block font-black">{guide.title}</span>
                <span
                  className={`mt-1 block text-sm leading-5 ${
                    guide.key === guideKind ? "text-slate-800" : "text-muted"
                  }`}
                >
                  {guide.description}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-[2rem] border border-border bg-black/20 p-3 shadow-xl">
            <div className="rounded-[1.4rem] border border-border bg-surface p-4 sm:p-5">
              <h3 className="text-xl font-black">{selectedGuide.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {selectedGuide.description}
              </p>

              <ol className="mt-5 space-y-4">
                {selectedGuide.steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-400 text-sm font-black text-slate-950">
                      {index + 1}
                    </span>
                    <span className="pt-1 text-sm font-semibold leading-6">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="mt-6 rounded-2xl border border-lime-400/25 bg-lime-400/5 p-4 text-sm leading-6 text-muted">
                {t("guide.note")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
