"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import type { BoxSummary } from "@/lib/boxes";

export default function ActiveBoxSwitcher() {
  const t = useTranslations("boxContext");
  const [boxes, setBoxes] = useState<BoxSummary[]>([]);
  const [boxId, setBoxId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/boxes", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((items: BoxSummary[]) => {
        setBoxes(items);
        setBoxId(items.find((item) => item.isActive)?.id ?? items[0]?.id ?? "");
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (!boxes.length) return null;

  async function selectBox(nextBoxId: string) {
    if (nextBoxId === boxId) return;
    setSaving(true);
    const response = await fetch("/api/boxes/active", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boxId: nextBoxId }),
    });
    if (!response.ok) {
      setSaving(false);
      return;
    }
    setBoxId(nextBoxId);
    window.location.reload();
  }

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
      <label className="mx-auto flex max-w-7xl items-center gap-2 text-sm font-semibold">
        <span className="shrink-0 text-muted">{t("label")}</span>
        <select
          value={boxId}
          disabled={saving}
          aria-label={t("label")}
          onChange={(event) => void selectBox(event.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-base"
        >
          {boxes.map((box) => (
            <option key={box.id} value={box.id}>
              {box.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
