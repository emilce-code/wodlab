"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "@/i18n/navigation";

import type { BoxSummary } from "@/lib/boxes";

type ActiveBoxContextValue = {
  boxes: BoxSummary[];
  activeBox: BoxSummary | null;
  saving: boolean;
  error: boolean;
  selectBox: (boxId: string) => Promise<boolean>;
  replaceBoxes: (boxes: BoxSummary[]) => void;
  clearError: () => void;
};

const ActiveBoxContext = createContext<ActiveBoxContextValue | null>(null);

export function ActiveBoxProvider({
  initialBoxes,
  children,
}: {
  initialBoxes: BoxSummary[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [boxes, setBoxes] = useState(initialBoxes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const activeBox =
    boxes.find((box) => box.isActive) ?? boxes[0] ?? null;

  async function selectBox(boxId: string) {
    if (boxId === activeBox?.id || saving) return true;
    setSaving(true);
    setError(false);
    try {
      const response = await fetch("/api/boxes/active", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId }),
      });
      if (!response.ok) {
        setError(true);
        return false;
      }
      setBoxes((current) =>
        current.map((box) => ({ ...box, isActive: box.id === boxId })),
      );
      router.refresh();
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setSaving(false);
    }
  }

  const value = {
    boxes,
    activeBox,
    saving,
    error,
    selectBox,
    replaceBoxes: setBoxes,
    clearError: () => setError(false),
  };

  return (
    <ActiveBoxContext.Provider value={value}>
      {children}
    </ActiveBoxContext.Provider>
  );
}

export function useActiveBox() {
  const context = useContext(ActiveBoxContext);
  if (!context) {
    throw new Error("useActiveBox must be used inside ActiveBoxProvider");
  }
  return context;
}
