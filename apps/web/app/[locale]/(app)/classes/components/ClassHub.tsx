"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
import { useActiveBox } from "@/components/layout/ActiveBoxContext";
import { Link } from "@/i18n/navigation";
import AthleteClasses from "./AthleteClasses";
import PageHeader from "@/components/layout/PageHeader";
import BoxLogo from "@/components/ui/BoxLogo";
import type { ClassSession, WorkoutOption } from "@/lib/boxes";
import { formatShortDate, formatTime, formatWeekdayDate } from "@/lib/date-formatters";

type View = "all" | "mine";

function requestMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: string | string[] }).message;
    return Array.isArray(message) ? message.join(", ") : message || fallback;
  }
  return fallback;
}

function dayKey(value: Date | string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function scheduleDays() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function localDateTimeValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ClassHub({ initialDay, initialView }: { initialDay?: string; initialView?: string }) {
  const t = useTranslations("boxes");
  const locale = useLocale();
  const { boxes, activeBox } = useActiveBox();
  const dayScroller = useRef<HTMLDivElement>(null);
  const days = useMemo(() => scheduleDays(), []);

  const boxId = activeBox?.id ?? "";
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [options, setOptions] = useState<WorkoutOption[]>([]);
  const [loading, setLoading] = useState(Boolean(boxes.length));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [showJoin, setShowJoin] = useState(boxes.length === 0);
  const [view, setView] = useState<View>("all");
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));

  const selectedBox = activeBox;
  const role = selectedBox?.role ?? null;
  const isStaff = role === "OWNER" || role === "COACH";

  const filteredClasses = useMemo(() => {
    const byDay = classes.filter((session) => dayKey(session.startsAt) === selectedDay);
    const byView = !isStaff && view === "mine" ? byDay.filter((session) => Boolean(session.currentUserBooking)) : byDay;
    return [...byView].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [classes, isStaff, selectedDay, view]);

  const countsByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const session of classes) counts.set(dayKey(session.startsAt), (counts.get(dayKey(session.startsAt)) ?? 0) + 1);
    return counts;
  }, [classes]);

  const selectedDate = days.find((date) => dayKey(date) === selectedDay) ?? days[0];

  async function loadClasses(selectedId: string) {
    setLoading(true);
    setError(null);
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 30);
    try {
      const response = await fetch(`/api/boxes/${selectedId}/classes?from=${from.toISOString()}&to=${to.toISOString()}`);
      const data = (await response.json()) as { classes?: ClassSession[] };
      if (!response.ok) throw new Error();
      setClasses(data.classes ?? []);
    } catch {
      setError(t("errors.load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!boxId || !isStaff) return;
    const controller = new AbortController();
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 30);
    void fetch(`/api/boxes/${boxId}/classes?from=${from.toISOString()}&to=${to.toISOString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return (await response.json()) as { classes?: ClassSession[] };
      })
      .then((data) => {
        setClasses(data.classes ?? []);
        setLoading(false);
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(t("errors.load"));
        setLoading(false);
      });
    return () => controller.abort();
  }, [boxId, isStaff, t]);

  useEffect(() => {
    if (!boxId || !isStaff) return;
    const controller = new AbortController();
    void fetch(`/api/boxes/${boxId}/options`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: WorkoutOption[]) => setOptions(data))
      .catch(() => undefined);
    return () => controller.abort();
  }, [boxId, isStaff]);


  async function submitBox(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/boxes/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode: String(form.get("joinCode") || "").trim() }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(requestMessage(data, t("errors.save")));
      return;
    }
    setJoinRequestSent(data.status === "PENDING");
    setShowJoin(false);
  }

  async function classAction(classId: string, method: "POST" | "PATCH" | "DELETE", suffix = "book", body?: object) {
    setBusyId(classId);
    setError(null);
    try {
      const response = await fetch(`/api/boxes/${boxId}/classes/${classId}${suffix ? `/${suffix}` : ""}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(requestMessage(data, t("errors.action")));
        return false;
      }
      await loadClasses(boxId);
      return true;
    } finally {
      setBusyId(null);
    }
  }

  function chooseDay(date: Date, index: number) {
    setSelectedDay(dayKey(date));
    dayScroller.current?.children[index]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  return (
    <div className={isStaff || !selectedBox ? "mx-auto max-w-4xl" : ""}>
      {isStaff || !selectedBox ? <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} /> : null}
    <div className="mt-6 space-y-4 pb-4">
      {boxes.length && (isStaff || !selectedBox) ? <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setShowJoin((value) => !value)}>{showJoin ? t("join.close") : t("join.another")}</Button> : null}

      {showJoin ? (
        <form onSubmit={submitBox} className="rounded-3xl border border-border bg-surface p-5 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl font-black text-accent">
            W
          </div>
          <h2 className="mt-4 text-xl font-bold">{t("join.title")}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">{t("join.description")}</p>
          <label htmlFor="join-box-code" className="sr-only">{t("join.code")}</label>
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
        <section role="status" className="rounded-3xl border border-accent/20 bg-surface p-5 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl font-bold text-accent">
            ✓
          </div>
          <h2 className="mt-3 font-bold text-accent">{t("join.title")}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">{t("join.pending")}</p>
        </section>
      ) : null}

      {error ? <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {selectedBox && !isStaff ? (
        <AthleteClasses key={selectedBox.id} box={selectedBox} initialDay={initialDay} initialView={initialView} joinAction={<Button type="button" variant="ghost" className="shrink-0" onClick={() => setShowJoin((value) => !value)}>{showJoin ? t("join.close") : t("join.another")}</Button>} />
      ) : <>
      {selectedBox ? (
        <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <div className="flex items-center gap-3 p-4">
            <BoxLogo name={selectedBox.name} path={selectedBox.logoPath} />
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-black">{selectedBox.name}</h2>
                <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">{t(`roles.${role?.toLowerCase() ?? "athlete"}`)}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted">
                {selectedBox.location || t("members", { count: selectedBox._count.memberships })}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <span className="text-xs text-muted">{t("members", { count: selectedBox._count.memberships })}</span>
            <Link
              href={`/boxes/${selectedBox.id}`}
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full bg-accent/10 px-3 text-xs font-bold text-accent"
            >
              {t("viewBox")}
            </Link>
          </div>
        </section>
      ) : null}

      {isStaff ? (
        <div className="grid grid-cols-2 gap-2">
          <Link href="/classes/schedule" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-accent">{t("classForm.open")}</Link>
          {role === "OWNER" || role === "COACH" ? (
            <Link href="/box-admin" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-surface-elevated px-3 text-sm font-semibold text-foreground">
              {t("joinRequests")}
            </Link>
          ) : null}
        </div>
      ) : null}

      <section aria-busy={loading} className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t("upcoming")}</p>
            <h2 className="mt-1 text-xl font-bold">
              {formatWeekdayDate(selectedDate, locale, false)}
            </h2>
          </div>
          <span className="shrink-0 text-xs font-semibold text-muted">{t("classCount", { count: filteredClasses.length })}</span>
        </div>

        <div ref={dayScroller} className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={t("views.label")}>
          {days.map((date, index) => {
            const key = dayKey(date);
            const active = key === selectedDay;
            const count = countsByDay.get(key) ?? 0;
            return (
              <button key={key} type="button" aria-pressed={active} onClick={() => chooseDay(date, index)} className={`min-w-[4.5rem] snap-center rounded-2xl border px-2 py-2.5 text-center transition ${active ? "border-accent bg-accent text-black shadow-sm" : "border-border bg-surface text-foreground"}`}>
                <span className={`block text-[11px] font-bold uppercase tracking-wide ${active ? "text-black/70" : "text-muted"}`}>{new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date)}</span>
                <span className="mt-0.5 block text-xl font-black leading-none">{date.getDate()}</span>
                <span className={`mt-1 block text-[10px] font-semibold ${active ? "text-black/70" : count ? "text-accent" : "text-muted"}`}>{count ? t("classCount", { count }) : "·"}</span>
              </button>
            );
          })}
        </div>

        {!isStaff ? (
          <div role="tablist" aria-label={t("views.label")} className="grid grid-cols-2 rounded-xl bg-surface-elevated p-1">
            {(["all", "mine"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={view === item} onClick={() => setView(item)} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${view === item ? "bg-surface text-accent shadow-sm" : "text-muted"}`}>{t(`views.${item}`)}</button>)}
          </div>
        ) : null}

        {loading ? <ClassSkeleton /> : null}
        {!loading && !filteredClasses.length ? <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-8 text-center"><p className="text-sm font-semibold">{view === "mine" ? t("emptyMine") : t("empty")}</p></div> : null}

        {!loading ? <div className="space-y-3">{filteredClasses.map((session) => <ClassCard key={session.id} session={session} locale={locale} options={options} isStaff={isStaff} busy={busyId === session.id} t={t} onAction={classAction} />)}</div> : null}
      </section>
      </>}
    </div>
    </div>
  );
}

function ClassCard({ session, locale, options, isStaff, busy, t, onAction }: { session: ClassSession; locale: string; options: WorkoutOption[]; isStaff: boolean; busy: boolean; t: ReturnType<typeof useTranslations>; onAction: (id: string, method: "POST" | "PATCH" | "DELETE", suffix?: string, body?: object) => Promise<boolean> }) {
  const levelT = useTranslations("workoutLevels.names");
  const full = session.bookedCount >= session.capacity;
  const booked = Boolean(session.currentUserBooking);
  const attended = session.currentUserBooking?.status === "ATTENDED";
  const spots = Math.max(0, session.capacity - session.bookedCount);
  const workoutLabel = session.workout ? `${session.workout.name}${session.workoutVariant ? ` · ${localizedLevelName(session.workoutVariant.level.key, session.workoutVariant.level.name, levelT)}` : ""}` : t("noWorkoutAssigned");
  const startsAtLabel = `${formatShortDate(session.startsAt, locale)} · ${formatTime(session.startsAt, locale)}`;
  const [staffPanel, setStaffPanel] = useState<"manage" | "attendance" | null>(null);
  const [manageStartsAt, setManageStartsAt] = useState(localDateTimeValue(new Date(session.startsAt)));
  const [manageWorkoutId, setManageWorkoutId] = useState(session.workout?.id ?? "");
  const [manageVariantId, setManageVariantId] = useState(session.workoutVariant?.id ?? "");
  const [manageDescription, setManageDescription] = useState(session.description ?? "");
  const manageVariants = options.find((option) => option.id === manageWorkoutId)?.variants ?? [];

  async function handleDeleteClass() {
    const saved = await onAction(session.id, "DELETE", "");
    if (saved) setStaffPanel(null);
  }

  function openManagePanel() {
    setManageStartsAt(localDateTimeValue(new Date(session.startsAt)));
    setManageWorkoutId(session.workout?.id ?? "");
    setManageVariantId(session.workoutVariant?.id ?? "");
    setManageDescription(session.description ?? "");
    setStaffPanel("manage");
  }

  function selectManageWorkout(workoutId: string) {
    setManageWorkoutId(workoutId);
    setManageVariantId("");
  }

  async function saveClassChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextStartsAt = session.bookedCount ? undefined : new Date(manageStartsAt);

    if (nextStartsAt && Number.isNaN(nextStartsAt.getTime())) {
      return;
    }

    const saved = await onAction(session.id, "PATCH", "", {
      description: manageDescription.trim() || null,
      startsAt: nextStartsAt?.toISOString(),
      workoutId: manageWorkoutId || null,
      workoutVariantId: manageVariantId || null,
    });
    if (saved) setStaffPanel(null);
  }

  return (
    <article className={`overflow-hidden rounded-2xl border bg-surface shadow-sm ${booked ? "border-accent/60 ring-1 ring-accent/20" : "border-border"}`}>
      {booked ? <div className="h-1 bg-accent" /> : null}
      <div className="p-4">
        <div className="flex gap-3">
          <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-elevated px-2 py-2 text-center">
            <span className="text-lg font-black leading-none">{formatTime(session.startsAt, locale)}</span>
            <span className="mt-1 text-[10px] font-bold uppercase text-muted">{formatShortDate(session.startsAt, locale)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-lg font-bold leading-tight">{session.name}</h3>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${full && !booked ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>{full && !booked ? t("full") : t("spots", { count: spots })}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{startsAtLabel}</p>
            {session.description ? <p className="mt-2 line-clamp-2 text-sm text-muted">{session.description}</p> : null}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-background/60 p-2">
            <span className="block text-[10px] font-semibold text-muted">{t("durationLabel")}</span>
            <strong className="mt-0.5 block text-xs">{t("durationValue", { duration: session.durationMinutes })}</strong>
          </div>
          <div className="rounded-xl bg-background/60 p-2">
            <span className="block text-[10px] font-semibold text-muted">{t("workoutLabel")}</span>
            {session.workout ? (
              <Link
                href={`/workouts/${session.workout.id}`}
                className="mt-1 inline-flex max-w-full items-center rounded-full bg-accent/10 px-2 py-1 text-xs font-bold text-accent transition hover:bg-accent/15"
              >
                <span className="truncate">{workoutLabel}</span>
              </Link>
            ) : (
              <strong className="mt-0.5 block truncate text-xs">{workoutLabel}</strong>
            )}
          </div>
          <div className="rounded-xl bg-background/60 p-2">
            <span className="block text-[10px] font-semibold text-muted">{isStaff ? t("bookedLabel") : t("statusLabel")}</span>
            <strong className="mt-0.5 block text-xs">{isStaff ? `${session.bookedCount}/${session.capacity}` : booked ? t("bookedStatus") : t("openStatus")}</strong>
          </div>
        </div>

        {!isStaff ? (
          booked ? <Button type="button" variant="secondary" disabled={busy || attended} onClick={() => void onAction(session.id, "DELETE")} className="mt-4 min-h-12 w-full">{attended ? t("attended") : t("cancelBooking")}</Button>
          : <Button type="button" disabled={full || busy} onClick={() => void onAction(session.id, "POST")} className="mt-4 min-h-12 w-full">{full ? t("full") : t("book")}</Button>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" className="min-h-11" onClick={openManagePanel}>{t("manageClass")}</Button>
            <Button type="button" variant="secondary" className="min-h-11" onClick={() => setStaffPanel("attendance")}>{t("attendance")}</Button>
          </div>
        )}
      </div>

      {staffPanel ? (
        <div className="fixed inset-0 z-[100] flex items-end bg-black/60 px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-12 backdrop-blur-sm sm:items-center sm:justify-center sm:pb-3" role="dialog" aria-modal="true" aria-labelledby={`class-${session.id}-${staffPanel}-title`}>
          <div className="max-h-[calc(100dvh-7rem)] w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl sm:max-h-[85dvh]">
            <div className="flex items-start justify-between gap-4 border-b border-border p-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{session.name}</p>
                <h3 id={`class-${session.id}-${staffPanel}-title`} className="mt-1 text-xl font-black">{staffPanel === "manage" ? t("manageClass") : t("attendance")}</h3>
                <p className="mt-1 text-sm text-muted">{startsAtLabel} · {t("durationValue", { duration: session.durationMinutes })}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label={t("classForm.cancel")} onClick={() => setStaffPanel(null)}>×</Button>
            </div>

            {staffPanel === "manage" ? (
              <form onSubmit={saveClassChanges} className="max-h-[calc(100dvh-16rem)] overflow-y-auto p-4 sm:max-h-[60dvh]">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-background/60 p-3">
                    <p className="text-sm font-semibold">{t("classMeta", { duration: session.durationMinutes, booked: session.bookedCount, capacity: session.capacity })}</p>
                    {session.bookedCount ? <p className="mt-1 text-xs text-muted">{t("dateLocked")}</p> : null}
                  </div>
                  <label className="text-sm font-semibold">
                    {t("classForm.startsAt")}
                    <input type="datetime-local" value={manageStartsAt} required disabled={session.bookedCount > 0} onChange={(event) => setManageStartsAt(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50" />
                  </label>
                  <label className="min-w-0 text-sm font-semibold">
                    {t("classForm.workout")}
                    <WorkoutLookup
                      options={options}
                      value={manageWorkoutId}
                      t={t}
                      surface="background"
                      onChange={selectManageWorkout}
                    />
                  </label>
                  <label className="min-w-0 text-sm font-semibold">
                    {t("classForm.variation")}
                    <select value={manageVariantId} onChange={(event) => setManageVariantId(event.target.value)} disabled={!manageWorkoutId} className="mt-1.5 min-h-12 w-full min-w-0 rounded-xl border border-border bg-background px-4 text-base disabled:opacity-50">
                      <option value="">{t("classForm.noVariation")}</option>
                      {manageVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name ?? localizedLevelName(variant.level.key, variant.level.name, levelT)}</option>)}
                    </select>
                  </label>
                  <label className="min-w-0 text-sm font-semibold">
                    {t("classForm.description")}
                    <textarea rows={4} value={manageDescription} onChange={(event) => setManageDescription(event.target.value)} placeholder={t("classForm.descriptionPlaceholder")} className="mt-1.5 w-full min-w-0 rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15" />
                  </label>
                  <Button type="submit" className="w-full" isLoading={busy}>{t("saveClassChanges")}</Button>
                  <Button type="button" variant="danger" className="w-full" disabled={busy} onClick={() => void handleDeleteClass()}>{t("deleteClass")}</Button>
                </div>
              </form>
            ) : (
              <div className="max-h-[calc(100dvh-16rem)] space-y-2 overflow-y-auto p-4 sm:max-h-[60dvh]">
                {session.bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between gap-2 rounded-xl bg-background p-2.5">
                    <span className="min-w-0 truncate text-sm">{booking.user.athleteProfile?.displayName ?? booking.user.email}</span>
                    <Button type="button" variant="secondary" disabled={busy} onClick={() => void onAction(session.id, "PATCH", "attendance", { userId: booking.userId, status: booking.status === "ATTENDED" ? "BOOKED" : "ATTENDED" })}>{booking.status === "ATTENDED" ? t("undoAttendance") : t("markAttended")}</Button>
                  </div>
                ))}
                {!session.bookings.length ? <p className="rounded-2xl bg-background/60 p-4 text-sm text-muted">{t("noBookings")}</p> : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ClassSkeleton() {
  return <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((item) => <div key={item} className="animate-pulse rounded-2xl border border-border bg-surface p-4"><div className="flex gap-4"><div className="h-14 w-14 rounded-xl bg-surface-elevated" /><div className="flex-1 space-y-2"><div className="h-5 w-2/3 rounded bg-surface-elevated" /><div className="h-4 w-1/2 rounded bg-surface-elevated" /><div className="h-4 w-3/4 rounded bg-surface-elevated" /></div></div></div>)}</div>;
}

function WorkoutLookup({
  options,
  value,
  name,
  t,
  surface = "surface",
  onChange,
}: {
  options: WorkoutOption[];
  value: string;
  name?: string;
  t: ReturnType<typeof useTranslations>;
  surface?: "surface" | "background";
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.id === value) ?? null;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) =>
        option.name.toLocaleLowerCase().includes(normalizedQuery),
      )
    : options;
  const fieldBackground = surface === "background" ? "bg-background" : "bg-surface";

  function selectWorkout(workoutId: string) {
    onChange(workoutId);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative mt-1.5 min-w-0">
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-12 w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-border ${fieldBackground} px-4 py-3 text-left text-base outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/15`}
      >
        <span className={selected ? "min-w-0 truncate" : "min-w-0 truncate text-muted"}>
          {selected?.name ?? t("classForm.noWorkout")}
        </span>
        <span className="shrink-0 text-muted" aria-hidden="true">
         ⌄
        </span>
      </button>

      {open ? (
        <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="border-b border-border p-2">
            <input
              type="search"
              value={query}
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("classForm.searchWorkout")}
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => selectWorkout("")}
              className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold ${!value ? "bg-accent/10 text-accent" : "text-muted hover:bg-background"}`}
            >
              {t("classForm.noWorkout")}
            </button>
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => selectWorkout(option.id)}
                className={`mt-1 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-semibold ${option.id === value ? "bg-accent/10 text-accent" : "hover:bg-background"}`}
              >
                <span className="min-w-0 truncate">{option.name}</span>
                <span className="shrink-0 text-xs font-normal text-muted">
                  {t("classForm.variantCount", {
                    count: option.variants.length,
                  })}
                </span>
              </button>
            ))}
            {!filteredOptions.length ? (
              <p className="px-3 py-6 text-center text-sm text-muted">
                {t("classForm.noWorkoutMatches")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function localizedLevelName(key: string, fallback: string, t: ReturnType<typeof useTranslations>) {
  const translationKey = key.toLowerCase();
  return t.has(translationKey) ? t(translationKey) : fallback;
}