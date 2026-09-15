"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
import ProgressiveList from "@/components/ui/ProgressiveList";
import { Link } from "@/i18n/navigation";
import type { BoxSummary, ClassSession, WorkoutOption } from "@/lib/boxes";

type Props = {
  initialBoxes: BoxSummary[];
};

function requestMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: string | string[] }).message;
    return Array.isArray(message) ? message.join(", ") : message || fallback;
  }
  return fallback;
}

export default function ClassHub({ initialBoxes }: Props) {
  const t = useTranslations("boxes");
  const locale = useLocale();

  const [boxes, setBoxes] = useState(initialBoxes);
  const [boxId, setBoxId] = useState(
    initialBoxes.find((box) => box.isActive)?.id ?? initialBoxes[0]?.id ?? "",
  );
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [options, setOptions] = useState<WorkoutOption[]>([]);
  const [loading, setLoading] = useState(Boolean(initialBoxes.length));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(initialBoxes.length === 0);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [view, setView] = useState<"all" | "mine">("all");

  const selectedBox = boxes.find((box) => box.id === boxId);
  const role = selectedBox?.role ?? null;
  const isStaff = role === "OWNER" || role === "COACH";

  const visibleClasses =
    !isStaff && view === "mine"
      ? classes.filter((session) => Boolean(session.currentUserBooking))
      : classes;

  async function loadClasses(selectedId: string) {
    setLoading(true);
    setError(null);

    const from = new Date();
    from.setHours(0, 0, 0, 0);

    const to = new Date(from);
    to.setDate(to.getDate() + 30);

    try {
      const response = await fetch(
        `/api/boxes/${selectedId}/classes?from=${from.toISOString()}&to=${to.toISOString()}`,
      );

      const data = (await response.json()) as {
        role?: BoxSummary["role"];
        classes?: ClassSession[];
      };

      if (!response.ok) throw new Error();

      setClasses(data.classes ?? []);
    } catch {
      setError(t("errors.load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!boxId) return;

    const controller = new AbortController();

    const from = new Date();
    from.setHours(0, 0, 0, 0);

    const to = new Date(from);
    to.setDate(to.getDate() + 30);

    void fetch(
      `/api/boxes/${boxId}/classes?from=${from.toISOString()}&to=${to.toISOString()}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error();

        return (await response.json()) as {
          role?: BoxSummary["role"];
          classes?: ClassSession[];
        };
      })
      .then((data) => {
        setClasses(data.classes ?? []);
        setLoading(false);
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        setError(t("errors.load"));
        setLoading(false);
      });

    return () => controller.abort();
  }, [boxId, t]);

  useEffect(() => {
    if (!boxId || !isStaff) {
      return;
    }

    const controller = new AbortController();

    void fetch(`/api/boxes/${boxId}/options`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: WorkoutOption[]) => setOptions(data))
      .catch(() => undefined);

    return () => controller.abort();
  }, [boxId, isStaff]);

  async function refreshBoxes() {
    const response = await fetch("/api/boxes");

    if (!response.ok) return;

    const data = (await response.json()) as BoxSummary[];

    setBoxes(data);

    if (!boxId && data[0]) {
      setBoxId(data[0].id);
    }
  }

  async function selectBox(nextBoxId: string) {
    setLoading(true);

    const response = await fetch("/api/boxes/active", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        boxId: nextBoxId,
      }),
    });

    if (!response.ok) {
      setError(t("errors.action"));
      setLoading(false);
      return;
    }

    setBoxes((current) =>
      current.map((box) => ({
        ...box,
        isActive: box.id === nextBoxId,
      })),
    );

    setBoxId(nextBoxId);
  }

  async function submitBox(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const joinCode = String(form.get("joinCode") || "").trim();

    const response = await fetch("/api/boxes/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        joinCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(requestMessage(data, t("errors.save")));
      return;
    }

    await refreshBoxes();

    setBoxId(data.id);
    setShowJoin(false);
  }

  async function submitClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);

    const workoutId = String(form.get("workoutId") || "");
    const workoutVariantId = String(form.get("workoutVariantId") || "");

    const response = await fetch(`/api/boxes/${boxId}/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: String(form.get("name")),
        description: String(form.get("description")) || undefined,
        startsAt: new Date(String(form.get("startsAt"))).toISOString(),
        durationMinutes: Number(form.get("durationMinutes")),
        capacity: Number(form.get("capacity")),
        workoutId: workoutId || undefined,
        workoutVariantId: workoutVariantId || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(requestMessage(data, t("errors.save")));
      return;
    }

    setShowCreateClass(false);

    await loadClasses(boxId);
  }

  async function classAction(
    classId: string,
    method: "POST" | "PATCH" | "DELETE",
    suffix = "book",
    body?: object,
  ) {
    setBusyId(classId);
    setError(null);

    const response = await fetch(
      `/api/boxes/${boxId}/classes/${classId}${suffix ? `/${suffix}` : ""}`,
      {
        method,
        headers: body
          ? {
              "Content-Type": "application/json",
            }
          : undefined,
        body: body ? JSON.stringify(body) : undefined,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      setError(requestMessage(data, t("errors.action")));
    } else {
      await loadClasses(boxId);
    }

    setBusyId(null);
  }

  return (
    <div className="mt-6 space-y-4">
      {boxes.length ? (
        <div className="sticky top-2 z-20 rounded-xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur">
          <label
            htmlFor="box-selector"
            className="text-xs font-semibold uppercase tracking-wide text-muted"
          >
            {t("selectBox")}
          </label>

          <div className="mt-2 flex gap-2">
            <select
              id="box-selector"
              value={boxId}
              onChange={(event) => void selectBox(event.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3"
            >
              {boxes.map((box) => (
                <option key={box.id} value={box.id}>
                  {box.name}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowJoin((value) => !value)}
            >
              {showJoin ? t("join.close") : t("join.another")}
            </Button>
          </div>
        </div>
      ) : null}

      {showJoin ? (
        <form
          onSubmit={submitBox}
          className="rounded-2xl border border-border bg-surface p-4"
        >
          <h2 className="font-bold">{t("join.title")}</h2>

          <p className="mt-1 text-sm text-muted">
            {t("join.description")}
          </p>

          <input
            name="joinCode"
            aria-label={t("join.code")}
            required
            minLength={6}
            maxLength={12}
            autoCapitalize="characters"
            autoCorrect="off"
            placeholder={t("join.placeholder")}
            className="mt-4 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-center font-mono text-lg uppercase tracking-[0.15em]"
          />

          <Button className="mt-3 w-full">
            {t("join.submit")}
          </Button>
        </form>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}

      {selectedBox ? (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                {selectedBox.name}
              </h2>

              <p className="mt-1 text-sm text-muted">
                {t("members", {
                  count: selectedBox._count.memberships,
                })}
              </p>
            </div>

            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              {t(`roles.${role?.toLowerCase() ?? "athlete"}`)}
            </span>
          </div>

          {role === "OWNER" ? (
            <Link
              href="/box-admin"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent"
            >
              {t("openAdministration")}
            </Link>
          ) : null}
        </section>
      ) : null}

      {isStaff ? (
        <Button
          type="button"
          className="w-full"
          onClick={() => setShowCreateClass((value) => !value)}
        >
          {showCreateClass
            ? t("classForm.cancel")
            : t("classForm.open")}
        </Button>
      ) : null}

      {showCreateClass && isStaff ? (
        <ClassForm
          t={t}
          options={options}
          onSubmit={submitClass}
        />
      ) : null}

      <section aria-busy={loading}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            {t("upcoming")}
          </h2>

          <span className="text-xs font-semibold text-muted">
            {t("classCount", {
              count: visibleClasses.length,
            })}
          </span>
        </div>

        {!isStaff ? (
          <div
            role="tablist"
            aria-label={t("views.label")}
            className="mb-4 grid grid-cols-2 rounded-xl bg-surface-elevated p-1"
          >
            {(["all", "mine"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={view === item}
                onClick={() => setView(item)}
                className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${
                  view === item
                    ? "bg-surface text-accent shadow-sm"
                    : "text-muted"
                }`}
              >
                {t(`views.${item}`)}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <p className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
            {t("loading")}
          </p>
        ) : null}

        {!loading && !visibleClasses.length ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            {view === "mine"
              ? t("emptyMine")
              : t("empty")}
          </p>
        ) : null}

        <ProgressiveList
          className="space-y-3"
          initialCount={8}
          increment={8}
        >
          {visibleClasses.map((session) => {
            const full =
              session.bookedCount >= session.capacity;

            return (
              <article
                key={session.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                      {new Intl.DateTimeFormat(locale, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(session.startsAt))}
                    </p>

                    <h3 className="mt-1 truncate text-lg font-bold">
                      {session.name}
                    </h3>

                    <p className="mt-1 text-sm text-muted">
                      {t("classMeta", {
                        duration: session.durationMinutes,
                        booked: session.bookedCount,
                        capacity: session.capacity,
                      })}
                    </p>

                    {session.workout ? (
                      <p className="mt-2 text-sm font-medium">
                        {session.workout.name}
                        {session.workoutVariant
                          ? ` · ${session.workoutVariant.level.name}`
                          : ""}
                      </p>
                    ) : null}

                    {session.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">
                        {session.description}
                      </p>
                    ) : null}
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      full
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    {full
                      ? t("full")
                      : t("spots", {
                          count:
                            session.capacity -
                            session.bookedCount,
                        })}
                  </span>
                </div>

                {!isStaff ? (
                  session.currentUserBooking ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        busyId === session.id ||
                        session.currentUserBooking.status ===
                          "ATTENDED"
                      }
                      onClick={() =>
                        void classAction(
                          session.id,
                          "DELETE",
                        )
                      }
                      className="mt-4 w-full"
                    >
                      {session.currentUserBooking.status ===
                      "ATTENDED"
                        ? t("attended")
                        : t("cancelBooking")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={
                        full || busyId === session.id
                      }
                      onClick={() =>
                        void classAction(
                          session.id,
                          "POST",
                        )
                      }
                      className="mt-4 w-full"
                    >
                      {full ? t("full") : t("book")}
                    </Button>
                  )
                ) : (
                  <details className="mt-4 border-t border-border pt-3">
                    <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">
                      {t("roster", {
                        count: session.bookings.length,
                      })}
                    </summary>

                    <div className="space-y-2">
                      {session.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-background p-2"
                        >
                          <span className="min-w-0 truncate text-sm">
                            {booking.user.athleteProfile
                              ?.displayName ??
                              booking.user.email}
                          </span>

                          <Button
                            type="button"
                            variant="secondary"
                            disabled={
                              busyId === session.id
                            }
                            onClick={() =>
                              void classAction(
                                session.id,
                                "PATCH",
                                "attendance",
                                {
                                  userId: booking.userId,
                                  status:
                                    booking.status ===
                                    "ATTENDED"
                                      ? "BOOKED"
                                      : "ATTENDED",
                                },
                              )
                            }
                          >
                            {booking.status === "ATTENDED"
                              ? t("undoAttendance")
                              : t("markAttended")}
                          </Button>
                        </div>
                      ))}

                      {!session.bookings.length ? (
                        <p className="text-sm text-muted">
                          {t("noBookings")}
                        </p>
                      ) : null}

                      <Button
                        type="button"
                        variant="danger"
                        className="mt-2 w-full"
                        onClick={() =>
                          void classAction(
                            session.id,
                            "DELETE",
                            "",
                          )
                        }
                      >
                        {t("deleteClass")}
                      </Button>
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </ProgressiveList>
      </section>
    </div>
  );
}

function ClassForm({
  t,
  options,
  onSubmit,
}: {
  t: ReturnType<typeof useTranslations>;
  options: WorkoutOption[];
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>,
  ) => void;
}) {
  const [workoutId, setWorkoutId] = useState("");

  const variants =
    options.find((option) => option.id === workoutId)
      ?.variants ?? [];

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-accent/30 bg-surface p-4"
    >
      <h2 className="font-bold">
        {t("classForm.title")}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          aria-label={t("classForm.name")}
          required
          minLength={2}
          placeholder={t("classForm.name")}
          className="min-h-11 rounded-lg border border-border bg-background px-3 sm:col-span-2"
        />

        <label className="text-sm font-semibold">
          {t("classForm.startsAt")}

          <input
            name="startsAt"
            type="datetime-local"
            required
            className="mt-1.5 min-h-12 w-full min-w-0 rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
          />
        </label>

        <label className="text-sm font-semibold">
          {t("classForm.duration")}

          <input
            name="durationMinutes"
            type="number"
            inputMode="numeric"
            min={15}
            max={240}
            defaultValue={60}
            required
            className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
          />
        </label>

        <label className="text-sm font-semibold">
          {t("classForm.capacity")}

          <input
            name="capacity"
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            defaultValue={12}
            required
            className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
          />
        </label>

        <label className="text-sm font-semibold">
          {t("classForm.workout")}

          <select
            name="workoutId"
            value={workoutId}
            onChange={(event) =>
              setWorkoutId(event.target.value)
            }
            className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
          >
            <option value="">
              {t("classForm.noWorkout")}
            </option>

            {options.map((option) => (
              <option
                key={option.id}
                value={option.id}
              >
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold">
          {t("classForm.variation")}

          <select
            name="workoutVariantId"
            disabled={!workoutId}
            className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base disabled:opacity-50"
          >
            <option value="">
              {t("classForm.noVariation")}
            </option>

            {variants.map((variant) => (
              <option
                key={variant.id}
                value={variant.id}
              >
                {variant.name ?? variant.level.name}
              </option>
            ))}
          </select>
        </label>

        <textarea
          name="description"
          aria-label={t("classForm.description")}
          rows={2}
          placeholder={t("classForm.description")}
          className="rounded-lg border border-border bg-background px-3 py-2 sm:col-span-2"
        />
      </div>

      <Button className="mt-4 w-full sm:w-auto">
        {t("classForm.submit")}
      </Button>
    </form>
  );
}