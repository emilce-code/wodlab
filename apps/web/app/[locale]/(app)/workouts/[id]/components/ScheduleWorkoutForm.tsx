"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";

type PrescriptionCategory = {
  key: string;
  name: string;
};

type Props = {
  workoutId: string;
  workoutName: string;
  workoutVariantId: string;
  workoutVariantLabel: string;
  prescriptionCategories: PrescriptionCategory[];
  preferredPrescriptionCategoryKey?: string | null;
};

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function ScheduleWorkoutForm({
  workoutId,
  workoutName,
  workoutVariantId,
  workoutVariantLabel,
  prescriptionCategories,
  preferredPrescriptionCategoryKey = null,
}: Props) {
  const t = useTranslations("workouts.schedule");
  const preferredCategory =
    preferredPrescriptionCategoryKey &&
    prescriptionCategories.some(
      (category) => category.key === preferredPrescriptionCategoryKey,
    )
      ? preferredPrescriptionCategoryKey
      : "";

  const [isOpen, setIsOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(getLocalDateValue);
  const [prescriptionCategoryKey, setPrescriptionCategoryKey] =
    useState(preferredCategory);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedDate, setSavedDate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savedDate === scheduledDate) {
      return;
    }

    setError(null);
    setSavedDate(null);

    if (!scheduledDate) {
      setError(t("dateRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/scheduled-workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId,
          workoutVariantId,
          scheduledDate,
          ...(prescriptionCategoryKey ? { prescriptionCategoryKey } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      });
      const data = (await response.json()) as { message?: string | string[] };

      if (!response.ok) {
        if (response.status === 409) {
          setError(t("duplicateError"));
          return;
        }

        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;
        setError(message ?? t("saveError"));
        return;
      }

      setSavedDate(scheduledDate);
      setNotes("");
    } catch {
      setError(t("connectionError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="schedule-workout-panel"
        onClick={() => {
          setIsOpen((open) => !open);
          setError(null);
        }}
        className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left sm:px-5"
      >
        <span className="min-w-0">
          <span className="block font-semibold">{t("title")}</span>
          <span className="mt-0.5 block text-sm text-muted">
            {t("collapsedDescription", { variation: workoutVariantLabel })}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-lg text-muted"
        >
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div
          id="schedule-workout-panel"
          className="border-t border-border p-4 sm:p-5"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {t("eyebrow")}
            </p>
            <h2 className="mt-1 text-xl font-bold">{workoutName}</h2>
            <p className="mt-1 text-sm text-muted">
              {t("selectedVariation", { variation: workoutVariantLabel })}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
            <div>
              <label
                htmlFor="scheduledWorkoutDate"
                className="mb-1.5 block text-sm font-medium"
              >
                {t("date")}
              </label>
              <input
                id="scheduledWorkoutDate"
                type="date"
                required
                min={getLocalDateValue()}
                value={scheduledDate}
                onChange={(event) => {
                  setScheduledDate(event.target.value);
                  setError(null);
                  setSavedDate(null);
                }}
                className="min-h-12 w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10 sm:max-w-xs"
              />
              <button
                type="button"
                onClick={() => setScheduledDate(getLocalDateValue())}
                className="mt-2 text-sm font-semibold text-accent hover:underline"
              >
                {t("today")}
              </button>
            </div>

            {prescriptionCategories.length > 0 && (
              <fieldset>
                <legend className="text-sm font-medium">
                  {t("prescription")}
                  <span className="ml-1 font-normal text-muted">
                    {t("optional")}
                  </span>
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={!prescriptionCategoryKey}
                    onClick={() => setPrescriptionCategoryKey("")}
                    className={[
                      "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition",
                      !prescriptionCategoryKey
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background text-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    {t("noPrescription")}
                  </button>
                  {prescriptionCategories.map((category) => {
                    const selected = prescriptionCategoryKey === category.key;

                    return (
                      <button
                        key={category.key}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setPrescriptionCategoryKey(category.key)}
                        className={[
                          "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition",
                          selected
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-background text-muted hover:text-foreground",
                        ].join(" ")}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div>
              <label
                htmlFor="scheduledWorkoutNotes"
                className="mb-1.5 block text-sm font-medium"
              >
                {t("notes")}
                <span className="ml-1 font-normal text-muted">
                  {t("optional")}
                </span>
              </label>
              <textarea
                id="scheduledWorkoutNotes"
                rows={3}
                maxLength={1000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t("notesPlaceholder")}
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {savedDate && (
              <Alert variant="success">
                <p className="font-semibold">{t("successTitle")}</p>
                <p className="mt-1">{t("successDescription")}</p>
                <ButtonLink
                  href="/dashboard"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                >
                  {t("backToDashboard")}
                </ButtonLink>
              </Alert>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={savedDate === scheduledDate}
                className="w-full sm:w-auto"
              >
                {isSubmitting
                  ? t("saving")
                  : savedDate === scheduledDate
                    ? t("scheduled")
                    : t("save")}
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
