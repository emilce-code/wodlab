"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import HelpGuide from "./HelpGuide";
import LogResultsGuide from "./LogResultsGuide";

type Guide = "concepts" | "logResults";

const guideIcons: Record<Guide, string> = {
  concepts: "◇",
  logResults: "✓",
};

export default function GuideHub() {
  const t = useTranslations("help.guideMenu");
  const [selectedGuide, setSelectedGuide] = useState<Guide>("concepts");

  function selectGuide(guide: Guide) {
    setSelectedGuide(guide);
    requestAnimationFrame(() => {
      document
        .getElementById("selected-guide")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="mt-6 space-y-5 sm:mt-8">
      <nav aria-labelledby="guide-menu-title">
        <div className="mb-3">
          <h2 id="guide-menu-title" className="text-lg font-black">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("description")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["concepts", "logResults"] as const).map((guide) => {
            const selected = selectedGuide === guide;
            return (
              <button
                key={guide}
                type="button"
                aria-pressed={selected}
                onClick={() => selectGuide(guide)}
                className={`flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left transition sm:min-h-28 ${
                  selected
                    ? "border-lime-400/60 bg-lime-400/10 shadow-lg shadow-lime-400/5"
                    : "border-border bg-surface hover:border-lime-400/30 hover:bg-surface-elevated"
                }`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black ${
                    selected
                      ? "bg-lime-400 text-slate-950"
                      : "bg-surface-elevated text-muted"
                  }`}
                >
                  {guideIcons[guide]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-black">
                    {t(`guides.${guide}.title`)}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-muted">
                    {t(`guides.${guide}.description`)}
                  </span>
                </span>
                <span aria-hidden="true" className="text-lg text-muted">
                  ›
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div id="selected-guide" className="scroll-mt-5">
        {selectedGuide === "concepts" ? <HelpGuide /> : <LogResultsGuide />}
      </div>
    </div>
  );
}
