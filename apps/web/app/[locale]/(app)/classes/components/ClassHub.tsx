"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
import { useActiveBox } from "@/components/layout/ActiveBoxContext";
import AthleteClasses from "./AthleteClasses";
import PageHeader from "@/components/layout/PageHeader";
import StaffClasses from "./StaffClasses";
function requestMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: string | string[] }).message;
    return Array.isArray(message) ? message.join(", ") : message || fallback;
  }
  return fallback;
}

export default function ClassHub({
  initialDay,
  initialView,
}: {
  initialDay?: string;
  initialView?: string;
}) {
  const t = useTranslations("boxes");
  const navigationT = useTranslations("navigation");
  const { boxes, activeBox } = useActiveBox();
  const [error, setError] = useState<string | null>(null);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [showJoin, setShowJoin] = useState(boxes.length === 0);

  const selectedBox = activeBox;
  const role = selectedBox?.role ?? null;
  const isStaff = role === "OWNER" || role === "COACH";

  async function submitBox(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/boxes/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        joinCode: String(form.get("joinCode") || "").trim(),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(requestMessage(data, t("errors.save")));
      return;
    }
    setJoinRequestSent(data.status === "PENDING");
    setShowJoin(false);
  }

  return (
    <div className={isStaff || !selectedBox ? "mx-auto max-w-6xl" : ""}>
      {isStaff ? (
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">{navigationT("boxes")}</h1>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowJoin((value) => !value)}
          >
            {showJoin ? t("join.close") : t("join.another")}
          </Button>
        </header>
      ) : !selectedBox ? (
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />
      ) : null}
      <div className="mt-4 space-y-4 pb-4">
        {boxes.length && !selectedBox ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => setShowJoin((value) => !value)}
          >
            {showJoin ? t("join.close") : t("join.another")}
          </Button>
        ) : null}

        {showJoin ? (
          <form
            onSubmit={submitBox}
            className="rounded-3xl border border-border bg-surface p-5 text-center shadow-sm"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl font-black text-accent">
              W
            </div>
            <h2 className="mt-4 text-xl font-bold">{t("join.title")}</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
              {t("join.description")}
            </p>
            <label htmlFor="join-box-code" className="sr-only">
              {t("join.code")}
            </label>
            <input
              id="join-box-code"
              name="joinCode"
              aria-label={t("join.code")}
              required
              minLength={6}
              maxLength={12}
              autoCapitalize="characters"
              autoCorrect="off"
              inputMode="text"
              placeholder={t("join.placeholder")}
              className="mt-5 min-h-14 w-full rounded-2xl border border-border bg-background px-4 text-center font-mono text-xl font-bold uppercase tracking-[0.22em] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <Button className="mt-3 w-full">{t("join.submit")}</Button>
          </form>
        ) : null}

        {joinRequestSent ? (
          <section
            role="status"
            className="rounded-3xl border border-accent/20 bg-surface p-5 text-center shadow-sm"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl font-bold text-accent">
              ✓
            </div>
            <h2 className="mt-3 font-bold text-accent">{t("join.title")}</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
              {t("join.pending")}
            </p>
          </section>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : null}

        {selectedBox && !isStaff ? (
          <AthleteClasses
            key={selectedBox.id}
            box={selectedBox}
            initialDay={initialDay}
            initialView={initialView}
            joinAction={
              <Button
                type="button"
                variant="ghost"
                className="shrink-0"
                onClick={() => setShowJoin((value) => !value)}
              >
                {showJoin ? t("join.close") : t("join.another")}
              </Button>
            }
          />
        ) : selectedBox ? (
          <StaffClasses
            key={selectedBox.id}
            box={selectedBox}
            initialDay={initialDay}
          />
        ) : null}
      </div>
    </div>
  );
}
