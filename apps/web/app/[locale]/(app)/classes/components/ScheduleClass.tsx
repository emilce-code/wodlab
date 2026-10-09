"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { useClientReady } from "@/hooks/use-local-storage-flag";
import { useActiveBox } from "@/components/layout/ActiveBoxContext";
import Button from "@/components/ui/Button";
import BoxDetailsIcon from "@/components/ui/BoxDetailsIcon";
import { Link } from "@/i18n/navigation";
import type { BoxSummary, WorkoutOption } from "@/lib/boxes";
import ScheduleWorkoutPicker from "./ScheduleWorkoutPicker";

type Values = {
  name: string;
  date: string;
  time: string;
  durationMinutes: string;
  capacity: string;
  description: string;
};
type Field = keyof Values;
function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function defaults(): Values {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    name: "",
    date: localDay(tomorrow),
    time: "18:00",
    durationMinutes: "60",
    capacity: "12",
    description: "",
  };
}

export default function ScheduleClass() {
  const { activeBox } = useActiveBox();
  const ready = useClientReady();
  const t = useTranslations("boxes.schedule");
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/classes"
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
      >
        <BoxDetailsIcon name="back" className="h-5 w-5" />
        {t("back")}
      </Link>
      {!ready ? (
        <p role="status" className="py-6 text-sm text-muted">
          {t("loadingForm")}
        </p>
      ) : activeBox &&
        (activeBox.role === "COACH" || activeBox.role === "OWNER") ? (
        <ScheduleForm key={activeBox.id} box={activeBox} />
      ) : (
        <p role="alert" className="py-6 text-sm text-muted">
          {t(activeBox ? "forbidden" : "noBox")}
        </p>
      )}
    </div>
  );
}

function ScheduleForm({ box }: { box: BoxSummary }) {
  const t = useTranslations("boxes.schedule");
  const levelT = useTranslations("workoutLevels.names");
  const [values, setValues] = useState(defaults);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [options, setOptions] = useState<WorkoutOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [selected, setSelected] = useState<WorkoutOption | null>(null);
  const [variantId, setVariantId] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    error: boolean;
    text: string;
  } | null>(null);
  const feedbackElement = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (feedback) feedbackElement.current?.scrollIntoView({ block: "nearest" });
  }, [feedback]);
  const submitting = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const requestId = useRef(0);
  const mounted = useRef(true);
  const optionsController = useRef<AbortController | null>(null);
  const submitController = useRef<AbortController | null>(null);
  const loadOptions = useCallback(async () => {
    optionsController.current?.abort();
    const controller = new AbortController();
    optionsController.current = controller;
    const request = ++requestId.current;
    setOptionsLoading(true);
    setOptionsError(false);
    try {
      const response = await fetch(
        `/api/boxes/${encodeURIComponent(box.id)}/options`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error();
      const data: WorkoutOption[] = await response.json();
      if (!Array.isArray(data)) throw new Error();
      if (request === requestId.current && !controller.signal.aborted)
        setOptions(data);
    } catch {
      if (!controller.signal.aborted && request === requestId.current)
        setOptionsError(true);
    } finally {
      if (!controller.signal.aborted && request === requestId.current)
        setOptionsLoading(false);
    }
  }, [box.id]);
  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(() => {
      if (mounted.current) void loadOptions();
    });
    return () => {
      mounted.current = false;
      optionsController.current?.abort();
      submitController.current?.abort();
    };
  }, [loadOptions]);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const nextErrors: Partial<Record<Field, string>> = {};
    const name = values.name.trim();
    if (name.length < 2 || name.length > 80) nextErrors.name = t("nameError");
    const startsAt = new Date(`${values.date}T${values.time}`);
    if (!values.date || Number.isNaN(startsAt.getTime()))
      nextErrors.date = t("dateError");
    if (!values.time) nextErrors.time = t("timeError");
    if (values.date && values.time && startsAt.getTime() <= Date.now())
      nextErrors.date = t("futureError");
    const duration = Number(values.durationMinutes),
      capacity = Number(values.capacity);
    if (!Number.isInteger(duration) || duration < 15 || duration > 240)
      nextErrors.durationMinutes = t("durationError");
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200)
      nextErrors.capacity = t("capacityError");
    if (values.description.length > 500)
      nextErrors.description = t("descriptionError");
    setErrors(nextErrors);
    setFeedback(null);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      form.current
        ?.querySelector<HTMLInputElement>(`[name="${firstError}"]`)
        ?.focus();
      return;
    }
    submitting.current = true;
    setPending(true);
    const controller = new AbortController();
    submitController.current = controller;
    try {
      const response = await fetch(
        `/api/boxes/${encodeURIComponent(box.id)}/classes`,
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            startsAt: startsAt.toISOString(),
            durationMinutes: duration,
            capacity,
            description: values.description.trim() || undefined,
            workoutId: selected?.id,
            workoutVariantId: variantId || undefined,
          }),
        },
      );
      if (!response.ok) {
        setFeedback({
          error: true,
          text: t(response.status === 403 ? "forbidden" : "saveError"),
        });
        return;
      }
      if (!mounted.current) return;
      setFeedback({ error: false, text: t("success", { name }) });
      setValues(defaults());
      setSelected(null);
      setVariantId("");
    } catch {
      if (!controller.signal.aborted)
        setFeedback({ error: true, text: t("saveError") });
    } finally {
      submitting.current = false;
      if (mounted.current) setPending(false);
    }
  }
  function field(field: Field, label: string, children: ReactNode) {
    return (
      <div className="min-w-0">
        <label
          htmlFor={`schedule-${field}`}
          className="mb-2 block text-sm font-semibold"
        >
          {label}
        </label>
        {children}
        {errors[field] ? (
          <p
            id={`schedule-${field}-error`}
            className="mt-1.5 text-xs text-red-400"
          >
            {errors[field]}
          </p>
        ) : null}
      </div>
    );
  }
  function input(
    field: Field,
    type: string,
    extra: {
      min?: number | string;
      max?: number;
      maxLength?: number;
      minLength?: number;
      placeholder?: string;
    } = {},
  ) {
    return (
      <input
        id={`schedule-${field}`}
        name={field}
        type={type}
        required={field !== "description"}
        value={values[field]}
        onChange={(event) => update(field, event.target.value)}
        aria-invalid={Boolean(errors[field])}
        aria-describedby={errors[field] ? `schedule-${field}-error` : undefined}
        className={`min-h-12 w-full rounded-xl border bg-surface px-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 ${errors[field] ? "border-red-500/50" : "border-border"}`}
        {...extra}
      />
    );
  }
  return (
    <>
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="break-words text-sm text-muted">{box.name}</p>
      </header>
      <form
        ref={form}
        noValidate
        onSubmit={(event) => void submit(event)}
        onFocus={(event) => {
          if (event.target.matches("input, select, textarea"))
            event.target.scrollIntoView({ block: "nearest" });
        }}
        className="space-y-6 pb-32 [&_input]:scroll-mb-[calc(10rem+env(safe-area-inset-bottom))] [&_select]:scroll-mb-[calc(10rem+env(safe-area-inset-bottom))] [&_textarea]:scroll-mb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-6 lg:[&_input]:scroll-mb-4 lg:[&_select]:scroll-mb-4 lg:[&_textarea]:scroll-mb-4"
      >
        <fieldset
          disabled={pending}
          className="min-w-0 space-y-4 disabled:opacity-70"
        >
          <legend className="mb-4 text-base font-bold">
            {t("essentials")}
          </legend>
          {field(
            "name",
            t("name"),
            input("name", "text", {
              minLength: 2,
              maxLength: 80,
              placeholder: t("namePlaceholder"),
            }),
          )}
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            {field(
              "date",
              t("date"),
              input("date", "date", { min: localDay(new Date()) }),
            )}
            {field("time", t("time"), input("time", "time"))}
            {field(
              "durationMinutes",
              t("duration"),
              input("durationMinutes", "number", { min: 15, max: 240 }),
            )}
            {field(
              "capacity",
              t("capacity"),
              input("capacity", "number", { min: 1, max: 200 }),
            )}
          </div>
        </fieldset>
        <fieldset
          disabled={pending}
          className="min-w-0 space-y-4 border-t border-border pt-5 disabled:opacity-70"
        >
          <legend className="float-left mb-4 w-full text-base font-bold">
            {t("optionalDetails")}
          </legend>
          <div className="clear-both min-w-0">
            <p
              id="schedule-workout-label"
              className="mb-2 text-sm font-semibold"
            >
              {t("workout")}
            </p>
            <ScheduleWorkoutPicker
              options={options}
              selected={selected}
              loading={optionsLoading}
              error={optionsError}
              disabled={pending}
              onRetry={() => void loadOptions()}
              onSelect={(workout) => {
                if (workout?.id !== selected?.id) setVariantId("");
                setSelected(workout);
              }}
            />
          </div>
          {selected && selected.variants.length > 0 ? (
            <div className="max-w-sm">
              <label
                htmlFor="schedule-variation"
                className="mb-2 block text-sm font-semibold"
              >
                {t("variation")}
              </label>
              <select
                id="schedule-variation"
                value={variantId}
                onChange={(event) => setVariantId(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-surface px-3 outline-none focus:border-accent"
              >
                <option value="">{t("noVariation")}</option>
                {selected.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name ||
                      (levelT.has(variant.level.key.toLowerCase())
                        ? levelT(variant.level.key.toLowerCase())
                        : variant.level.name)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {field(
            "description",
            t("description"),
            <>
              <textarea
                id="schedule-description"
                name="description"
                rows={3}
                maxLength={500}
                value={values.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder={t("descriptionPlaceholder")}
                aria-invalid={Boolean(errors.description)}
                aria-describedby="schedule-description-count"
                className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <p
                id="schedule-description-count"
                className="mt-1 text-right text-xs text-muted"
              >
                {values.description.length}/500
              </p>
            </>,
          )}
        </fieldset>
        {feedback ? (
          <p
            ref={feedbackElement}
            role={feedback.error ? "alert" : "status"}
            className={`scroll-mb-[calc(10rem+env(safe-area-inset-bottom))] text-sm lg:scroll-mb-4 ${feedback.error ? "text-red-400" : "text-accent"}`}
          >
            {feedback.text}
          </p>
        ) : null}
        <footer
          data-schedule-action
          className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background px-4 pb-4 pt-3 lg:static lg:flex lg:justify-end lg:px-0"
        >
          <Button
            type="submit"
            size="lg"
            isLoading={pending}
            className="w-full rounded-xl lg:w-auto"
          >
            {t(pending ? "creating" : "create")}
          </Button>
        </footer>
      </form>
    </>
  );
}
