"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
import type {
  BoxMember,
  BoxSummary,
  ClassSession,
  WorkoutOption,
} from "@/lib/boxes";

type Props = { initialBoxes: BoxSummary[] };

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
  const [boxId, setBoxId] = useState(initialBoxes[0]?.id ?? "");
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [options, setOptions] = useState<WorkoutOption[]>([]);
  const [members, setMembers] = useState<BoxMember[]>([]);
  const [loading, setLoading] = useState(Boolean(initialBoxes.length));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(initialBoxes.length === 0);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const selectedBox = boxes.find((box) => box.id === boxId);
  const role = selectedBox?.role ?? null;
  const isStaff = role === "OWNER" || role === "COACH";

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
        if (caught instanceof DOMException && caught.name === "AbortError")
          return;
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
    void fetch(`/api/boxes/${boxId}/options`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: WorkoutOption[]) => setOptions(data))
      .catch(() => undefined);
    return () => controller.abort();
  }, [boxId, isStaff]);

  useEffect(() => {
    if (!boxId || role !== "OWNER") return;
    const controller = new AbortController();
    void fetch(`/api/boxes/${boxId}/members`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: BoxMember[]) => setMembers(data))
      .catch(() => undefined);
    return () => controller.abort();
  }, [boxId, role]);

  async function refreshBoxes() {
    const response = await fetch("/api/boxes");
    if (!response.ok) return;
    const data = (await response.json()) as BoxSummary[];
    setBoxes(data);
    if (!boxId && data[0]) setBoxId(data[0].id);
  }

  async function submitBox(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const mode = String(form.get("mode"));
    const body =
      mode === "join"
        ? { joinCode: String(form.get("joinCode")) }
        : {
            name: String(form.get("name")),
            description: String(form.get("description")) || undefined,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
    const response = await fetch(
      mode === "join" ? "/api/boxes/join" : "/api/boxes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(requestMessage(data, t("errors.save")));
      return;
    }
    await refreshBoxes();
    setBoxId(data.id);
    setShowSetup(false);
    event.currentTarget.reset();
  }

  async function submitClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const workoutId = String(form.get("workoutId") || "");
    const workoutVariantId = String(form.get("workoutVariantId") || "");
    const response = await fetch(`/api/boxes/${boxId}/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    event.currentTarget.reset();
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
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    const data = await response.json();
    if (!response.ok) setError(requestMessage(data, t("errors.action")));
    else await loadClasses(boxId);
    setBusyId(null);
  }

  async function updateMember(memberId: string, nextRole: "COACH" | "ATHLETE") {
    setBusyId(memberId);
    const response = await fetch(`/api/boxes/${boxId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    if (response.ok) {
      setMembers((current) =>
        current.map((member) =>
          member.id === memberId ? { ...member, role: nextRole } : member,
        ),
      );
    } else {
      setError(t("errors.action"));
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
              onChange={(event) => {
                setLoading(true);
                setBoxId(event.target.value);
              }}
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
              onClick={() => setShowSetup((value) => !value)}
            >
              {t("manage")}
            </Button>
          </div>
        </div>
      ) : null}

      {showSetup ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <form
            onSubmit={submitBox}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <input type="hidden" name="mode" value="join" />
            <h2 className="font-bold">{t("join.title")}</h2>
            <p className="mt-1 text-sm text-muted">{t("join.description")}</p>
            <input
              name="joinCode"
              aria-label={t("join.code")}
              required
              minLength={6}
              maxLength={12}
              placeholder={t("join.code")}
              className="mt-4 min-h-11 w-full rounded-lg border border-border bg-background px-3 uppercase"
            />
            <Button className="mt-3 w-full">{t("join.submit")}</Button>
          </form>
          <form
            onSubmit={submitBox}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <input type="hidden" name="mode" value="create" />
            <h2 className="font-bold">{t("create.title")}</h2>
            <p className="mt-1 text-sm text-muted">{t("create.description")}</p>
            <input
              name="name"
              aria-label={t("create.name")}
              required
              minLength={2}
              placeholder={t("create.name")}
              className="mt-4 min-h-11 w-full rounded-lg border border-border bg-background px-3"
            />
            <textarea
              name="description"
              aria-label={t("create.boxDescription")}
              rows={2}
              placeholder={t("create.boxDescription")}
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
            <Button className="mt-3 w-full">{t("create.submit")}</Button>
          </form>
          {role === "OWNER" && members.length ? (
            <section className="rounded-xl border border-border bg-surface p-4 sm:col-span-2">
              <h2 className="font-bold">{t("memberManagement")}</h2>
              <div className="mt-3 space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-background p-3"
                  >
                    <span className="min-w-0 truncate text-sm">
                      {member.user.athleteProfile?.displayName ??
                        member.user.coachProfile?.displayName ??
                        member.user.email}
                    </span>
                    {member.role === "OWNER" ? (
                      <span className="text-xs font-semibold text-accent">
                        {t("owner")}
                      </span>
                    ) : (
                      <select
                        aria-label={t("memberRole")}
                        value={member.role}
                        disabled={busyId === member.id}
                        onChange={(event) =>
                          void updateMember(
                            member.id,
                            event.target.value as "COACH" | "ATHLETE",
                          )
                        }
                        className="min-h-11 rounded-lg border border-border bg-surface px-2 text-sm"
                      >
                        <option value="ATHLETE">{t("athlete")}</option>
                        <option value="COACH">{t("coach")}</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
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
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">{selectedBox.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {t("members", { count: selectedBox._count.memberships })}
              </p>
              {isStaff ? (
                <p className="mt-1 font-mono text-xs text-accent">
                  {t("joinCode", { code: selectedBox.joinCode })}
                </p>
              ) : null}
            </div>
            {isStaff ? (
              <Button
                type="button"
                onClick={() => setShowCreateClass((value) => !value)}
                className="w-full sm:w-auto"
              >
                {showCreateClass ? t("classForm.cancel") : t("classForm.open")}
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {showCreateClass && isStaff ? (
        <ClassForm t={t} options={options} onSubmit={submitClass} />
      ) : null}

      <section aria-busy={loading}>
        <h2 className="mb-3 text-lg font-bold">{t("upcoming")}</h2>
        {loading ? (
          <p className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
            {t("loading")}
          </p>
        ) : null}
        {!loading && !classes.length ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            {t("empty")}
          </p>
        ) : null}
        <div className="space-y-3">
          {classes.map((session) => {
            const full = session.bookedCount >= session.capacity;
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
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${full ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}
                  >
                    {full
                      ? t("full")
                      : t("spots", {
                          count: session.capacity - session.bookedCount,
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
                        session.currentUserBooking.status === "ATTENDED"
                      }
                      onClick={() => void classAction(session.id, "DELETE")}
                      className="mt-4 w-full"
                    >
                      {session.currentUserBooking.status === "ATTENDED"
                        ? t("attended")
                        : t("cancelBooking")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={full || busyId === session.id}
                      onClick={() => void classAction(session.id, "POST")}
                      className="mt-4 w-full"
                    >
                      {full ? t("full") : t("book")}
                    </Button>
                  )
                ) : (
                  <details className="mt-4 border-t border-border pt-3">
                    <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">
                      {t("roster", { count: session.bookings.length })}
                    </summary>
                    <div className="space-y-2">
                      {session.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-background p-2"
                        >
                          <span className="min-w-0 truncate text-sm">
                            {booking.user.athleteProfile?.displayName ??
                              booking.user.email}
                          </span>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={busyId === session.id}
                            onClick={() =>
                              void classAction(
                                session.id,
                                "PATCH",
                                "attendance",
                                {
                                  userId: booking.userId,
                                  status:
                                    booking.status === "ATTENDED"
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
                        <p className="text-sm text-muted">{t("noBookings")}</p>
                      ) : null}
                      <Button
                        type="button"
                        variant="danger"
                        className="mt-2 w-full"
                        onClick={() =>
                          void classAction(session.id, "DELETE", "")
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
        </div>
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
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [workoutId, setWorkoutId] = useState("");
  const variants =
    options.find((option) => option.id === workoutId)?.variants ?? [];
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-accent/30 bg-surface p-4"
    >
      <h2 className="font-bold">{t("classForm.title")}</h2>
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
        <input
          name="durationMinutes"
          type="number"
          min={15}
          max={240}
          defaultValue={60}
          required
          aria-label={t("classForm.duration")}
          className="min-h-11 rounded-lg border border-border bg-background px-3"
        />
        <input
          name="capacity"
          type="number"
          min={1}
          max={200}
          defaultValue={12}
          required
          aria-label={t("classForm.capacity")}
          className="min-h-11 rounded-lg border border-border bg-background px-3"
        />
        <select
          name="workoutId"
          aria-label={t("classForm.workout")}
          value={workoutId}
          onChange={(event) => setWorkoutId(event.target.value)}
          className="min-h-11 rounded-lg border border-border bg-background px-3"
        >
          <option value="">{t("classForm.noWorkout")}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <select
          name="workoutVariantId"
          aria-label={t("classForm.variation")}
          disabled={!workoutId}
          className="min-h-11 rounded-lg border border-border bg-background px-3"
        >
          <option value="">{t("classForm.noVariation")}</option>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name ?? variant.level.name}
            </option>
          ))}
        </select>
        <textarea
          name="description"
          aria-label={t("classForm.description")}
          rows={2}
          placeholder={t("classForm.description")}
          className="rounded-lg border border-border bg-background px-3 py-2 sm:col-span-2"
        />
      </div>
      <Button className="mt-4 w-full sm:w-auto">{t("classForm.submit")}</Button>
    </form>
  );
}
