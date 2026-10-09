"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import Alert from "./Alert";
import Button from "./Button";

type ToastMessage = {
  message: string;
  variant?: "success" | "error" | "info";
  action?: { label: string; onClick: () => void };
};
type Entry = ToastMessage & { id: number };
type ToastContextValue = {
  notify: (message: ToastMessage) => number;
  dismiss: (id: number) => void;
};
const ToastContext = createContext<ToastContextValue | null>(null);

function ToastItem({
  entry,
  dismiss,
}: {
  entry: Entry;
  dismiss: (id: number) => void;
}) {
  const t = useTranslations("common");
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || (entry.variant === "error" && entry.action)) return;
    const timer = window.setTimeout(
      () => dismiss(entry.id),
      entry.variant === "error" ? 6000 : entry.variant === "info" ? 5000 : 3000,
    );
    return () => window.clearTimeout(timer);
  }, [entry, dismiss, paused]);
  return (
    <Alert
      variant={entry.variant ?? "success"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
      className="pointer-events-auto shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 break-words">{entry.message}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("close")}
          className="-my-2 -mr-2 shrink-0"
          onClick={() => dismiss(entry.id)}
        >
          <span aria-hidden="true">×</span>
        </Button>
      </div>
      {entry.action ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => {
            dismiss(entry.id);
            entry.action?.onClick();
          }}
        >
          {entry.action.label}
        </Button>
      ) : null}
    </Alert>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const [entries, setEntries] = useState<Entry[]>([]);
  const sequence = useRef(0);
  const dismiss = useCallback(
    (id: number) => setEntries((old) => old.filter((entry) => entry.id !== id)),
    [],
  );
  const notify = useCallback((message: ToastMessage) => {
    const id = ++sequence.current;
    setEntries((old) => [
      ...old
        .filter(
          (entry) =>
            message.action ||
            entry.action ||
            entry.message !== message.message ||
            (entry.variant ?? "success") !== (message.variant ?? "success"),
        )
        .slice(-2),
      { ...message, id },
    ]);
    return id;
  }, []);
  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-[calc(9rem+env(safe-area-inset-bottom))] z-80 flex max-h-[calc(100dvh-11rem)] flex-col gap-3 overflow-y-auto lg:inset-x-auto lg:top-6 lg:right-6 lg:bottom-auto lg:w-96 lg:max-w-[calc(100vw-3rem)]"
        aria-label={t("feedback")}
      >
        {entries.map((entry) => (
          <ToastItem key={entry.id} entry={entry} dismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast requires ToastProvider");
  return context;
}
