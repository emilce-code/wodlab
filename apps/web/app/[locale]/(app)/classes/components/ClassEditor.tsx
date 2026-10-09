"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { useConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { classApiPath } from "@/lib/class-schedule";
import type { ClassSession, WorkoutOption } from "@/lib/boxes";
import ScheduleWorkoutPicker from "./ScheduleWorkoutPicker";

function draft(session: ClassSession) {
  const date = new Date(session.startsAt);
  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
    workoutId: session.workout?.id ?? "",
    variantId: session.workoutVariant?.id ?? "",
    description: session.description ?? "",
  };
}
export default function ClassEditor({
  session,
  boxId,
  page = false,
  guardRef,
  onChange,
  onDelete,
}: {
  session: ClassSession;
  boxId: string;
  page?: boolean;
  guardRef?: RefObject<() => boolean>;
  onChange: (session: ClassSession) => void;
  onDelete: () => void;
}) {
  const t = useTranslations("classStaff");
  const levelT = useTranslations("workoutLevels.names");
  const [values, setValues] = useState(() => draft(session));
  const [baseline, setBaseline] = useState(() => draft(session));
  const [options, setOptions] = useState<WorkoutOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const request = useRef<AbortController | null>(null);
  const optionsRequest = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  const { confirm, dialog } = useConfirmationDialog();
  const dirty = JSON.stringify(values) !== JSON.stringify(baseline);
  const locked = session.bookedCount > 0;
  const hasAttendance = session.bookings.some(
    (booking) => booking.status === "ATTENDED",
  );
  const fallback: WorkoutOption | null = session.workout
    ? {
        ...session.workout,
        variants: session.workoutVariant ? [session.workoutVariant] : [],
      }
    : null;
  const selected =
    options.find((option) => option.id === values.workoutId) ??
    (fallback?.id === values.workoutId ? fallback : null);
  const variants = selected?.variants ?? [];
  const loadOptions = useCallback(async () => {
    optionsRequest.current?.abort();
    const controller = new AbortController();
    optionsRequest.current = controller;
    setLoading(true);
    setOptionsError(false);
    try {
      const response = await fetch(
        `/api/boxes/${encodeURIComponent(boxId)}/options`,
        { signal: controller.signal },
      );
      if (!response.ok) throw Error();
      const data: WorkoutOption[] = await response.json();
      if (!Array.isArray(data)) throw Error();
      if (!controller.signal.aborted) setOptions(data);
    } catch {
      if (!controller.signal.aborted) setOptionsError(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [boxId]);
  useEffect(() => {
    let alive = true;
    void Promise.resolve().then(() => {
      if (alive) void loadOptions();
    });
    return () => {
      alive = false;
      optionsRequest.current?.abort();
      request.current?.abort();
    };
  }, [loadOptions]);
  useEffect(() => {
    feedback.current?.scrollIntoView({ block: "nearest" });
  }, [error, success]);
  useEffect(() => {
    const canLeave = () => !pending && (!dirty || window.confirm(t("unsaved")));
    if (guardRef) guardRef.current = canLeave;
    if (!dirty && !pending) return;
    function unload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    function navigate(event: MouseEvent) {
      const link = (event.target as HTMLElement).closest("a[href]");
      if (
        !link ||
        (link.hasAttribute("data-class-context") &&
          window.matchMedia("(min-width: 1024px)").matches)
      )
        return;
      if (!canLeave()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    const navigation = (window as unknown as { navigation?: EventTarget })
      .navigation;
    function traverse(event: Event) {
      if (
        (event as Event & { navigationType?: string }).navigationType ===
          "traverse" &&
        event.cancelable &&
        !canLeave()
      )
        event.preventDefault();
    }
    document.addEventListener("click", navigate, true);
    window.addEventListener("beforeunload", unload);
    navigation?.addEventListener("navigate", traverse);
    return () => {
      document.removeEventListener("click", navigate, true);
      window.removeEventListener("beforeunload", unload);
      navigation?.removeEventListener("navigate", traverse);
      if (guardRef) guardRef.current = () => true;
    };
  }, [dirty, pending, t, guardRef]);
  function update(field: keyof typeof values, value: string) {
    setValues((old) => ({ ...old, [field]: value }));
    setSuccess(false);
    setFieldError("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    const startsAt = new Date(`${values.date}T${values.time}`);
    const dateChanged =
      values.date !== baseline.date || values.time !== baseline.time;
    if (
      !locked &&
      dateChanged &&
      (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now())
    ) {
      setFieldError(t("futureError"));
      return;
    }
    if (values.description.length > 500) {
      setFieldError(t("descriptionError"));
      return;
    }
    busy.current = true;
    setPending(true);
    setError("");
    setSuccess(false);
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await fetch(classApiPath(boxId, session.id), {
        method: "PATCH",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(!locked && dateChanged
            ? { startsAt: startsAt.toISOString() }
            : {}),
          workoutId: values.workoutId || null,
          workoutVariantId: values.variantId || null,
          description: values.description.trim() || null,
        }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          const latestResponse = await fetch(classApiPath(boxId, session.id), {
            signal: controller.signal,
            cache: "no-store",
          });
          if (latestResponse.ok) {
            const latest: ClassSession = await latestResponse.json();
            if (!controller.signal.aborted) onChange(latest);
          }
        }
        setError(
          t(
            response.status === 409
              ? "dateConflict"
              : response.status === 403
                ? "forbidden"
                : "saveError",
          ),
        );
        return;
      }
      const raw: ClassSession = await response.json();
      if (controller.signal.aborted) return;
      const saved = {
        ...session,
        ...raw,
        role: session.role,
        bookedCount: raw.bookings.length,
      };
      const next = draft(saved);
      setValues(next);
      setBaseline(next);
      setSuccess(true);
      onChange(saved);
    } catch {
      if (!controller.signal.aborted) setError(t("saveError"));
    } finally {
      busy.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }
  async function remove() {
    if (busy.current || hasAttendance) return;
    const approved = await confirm({
      title: t("delete"),
      description: t("deleteConfirm"),
      confirmLabel: t("delete"),
      danger: true,
    });
    if (!approved || busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await fetch(classApiPath(boxId, session.id), {
        method: "DELETE",
        signal: controller.signal,
      });
      if (!response.ok) {
        setError(t(response.status === 409 ? "deleteLocked" : "deleteError"));
        return;
      }
      if (!controller.signal.aborted) {
        setBaseline(values);
        onDelete();
      }
    } catch {
      if (!controller.signal.aborted) setError(t("deleteError"));
    } finally {
      busy.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }
  const inputStyle =
    "min-h-12 w-full rounded-xl border border-border bg-surface px-3 outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <section className="min-w-0 space-y-4">
      <h2 className="text-lg font-bold">{t("edit")}</h2>
      <form
        noValidate
        onSubmit={(event) => void save(event)}
        onFocus={(event) => {
          if (
            event.target.matches("input,select,textarea") &&
            !event.target.closest("dialog")
          )
            event.target.scrollIntoView({ block: "nearest" });
        }}
        className={`space-y-5 [&_input]:scroll-mb-[calc(10rem+env(safe-area-inset-bottom))] [&_textarea]:scroll-mb-[calc(10rem+env(safe-area-inset-bottom))] lg:[&_input]:scroll-mb-4 lg:[&_textarea]:scroll-mb-4 ${page ? "pb-32 lg:pb-0" : ""}`}
      >
        <fieldset disabled={pending} className="min-w-0 space-y-4">
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <label className="min-w-0 text-sm font-semibold">
              {t("date")}
              <input
                type="date"
                value={locked ? draft(session).date : values.date}
                required
                disabled={locked}
                onChange={(event) => update("date", event.target.value)}
                aria-describedby={
                  locked
                    ? "class-date-locked"
                    : fieldError
                      ? "class-field-error"
                      : undefined
                }
                className={`mt-2 ${inputStyle}`}
              />
            </label>
            <label className="min-w-0 text-sm font-semibold">
              {t("time")}
              <input
                type="time"
                value={locked ? draft(session).time : values.time}
                required
                disabled={locked}
                onChange={(event) => update("time", event.target.value)}
                aria-describedby={locked ? "class-date-locked" : undefined}
                className={`mt-2 ${inputStyle}`}
              />
            </label>
          </div>
          {locked ? (
            <p id="class-date-locked" className="text-sm text-muted">
              {t("dateLocked")}
            </p>
          ) : null}
          {fieldError ? (
            <p
              id="class-field-error"
              role="alert"
              className="text-sm text-red-400"
            >
              {fieldError}
            </p>
          ) : null}
          <div className="space-y-2">
            <p className="text-sm font-semibold">{t("workout")}</p>
            <ScheduleWorkoutPicker
              options={options}
              selected={selected}
              loading={loading}
              error={optionsError}
              disabled={pending}
              onRetry={() => void loadOptions()}
              onSelect={(workout) => {
                setValues((old) => ({
                  ...old,
                  workoutId: workout?.id ?? "",
                  variantId: workout?.id === old.workoutId ? old.variantId : "",
                }));
                setSuccess(false);
              }}
            />
          </div>
          {selected && variants.length ? (
            <label className="block text-sm font-semibold">
              {t("variation")}
              <select
                aria-label={t("variation")}
                value={values.variantId}
                onChange={(event) => update("variantId", event.target.value)}
                className={`mt-2 ${inputStyle}`}
              >
                <option value="">{t("noVariation")}</option>
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name ||
                      (levelT.has(variant.level.key.toLowerCase())
                        ? levelT(variant.level.key.toLowerCase())
                        : variant.level.name)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-sm font-semibold">
            {t("description")}
            <textarea
              value={values.description}
              aria-label={t("description")}
              maxLength={500}
              rows={4}
              onChange={(event) => update("description", event.target.value)}
              className={`mt-2 py-3 ${inputStyle}`}
            />
            <span className="mt-1 block text-right text-xs font-normal text-muted">
              {values.description.length}/500
            </span>
          </label>
        </fieldset>
        {error || success ? (
          <p
            ref={feedback}
            role={error ? "alert" : "status"}
            className={`scroll-mb-[calc(10rem+env(safe-area-inset-bottom))] text-sm lg:scroll-mb-4 ${error ? "text-red-400" : "text-accent"}`}
          >
            {error || t("saved")}
          </p>
        ) : null}
        <div
          data-class-action
          className={
            page
              ? "fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background px-4 pt-3 pb-4 lg:static lg:px-0"
              : "border-t border-border pt-4"
          }
        >
          <Button
            type="submit"
            isLoading={pending}
            disabled={!dirty}
            className="w-full rounded-xl lg:w-auto"
          >
            {t(pending ? "saving" : "save")}
          </Button>
        </div>
        <div className="space-y-2 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            disabled={pending || hasAttendance}
            className="text-red-400"
            onClick={() => void remove()}
          >
            {t("delete")}
          </Button>
          {hasAttendance ? (
            <p className="text-xs text-muted">{t("deleteLocked")}</p>
          ) : null}
        </div>
      </form>
      {dialog}
    </section>
  );
}
