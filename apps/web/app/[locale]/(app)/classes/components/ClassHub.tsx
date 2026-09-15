"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import type { BoxSummary, ClassSession, WorkoutOption } from "@/lib/boxes";

type Props = { initialBoxes: BoxSummary[] };
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

export default function ClassHub({ initialBoxes }: Props) {
  const t = useTranslations("boxes");
  const locale = useLocale();
  const dayScroller = useRef<HTMLDivElement>(null);
  const days = useMemo(scheduleDays, []);

  const [boxes, setBoxes] = useState(initialBoxes);
  const [boxId, setBoxId] = useState(initialBoxes.find((box) => box.isActive)?.id ?? initialBoxes[0]?.id ?? "");
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [options, setOptions] = useState<WorkoutOption[]>([]);
  const [loading, setLoading] = useState(Boolean(initialBoxes.length));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(initialBoxes.length === 0);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [view, setView] = useState<View>("all");
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));

  const selectedBox = boxes.find((box) => box.id === boxId);
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
    if (!boxId) return;
    const controller = new AbortController();
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 30);
    setLoading(true);
    setError(null);
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
  }, [boxId, t]);

  useEffect(() => {
    if (!boxId || !isStaff) return;
    const controller = new AbortController();
    void fetch(`/api/boxes/${boxId}/options`, { signal: controller.signal })
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
    if (!boxId && data[0]) setBoxId(data[0].id);
  }

  async function selectBox(nextBoxId: string) {
    setLoading(true);
    const response = await fetch("/api/boxes/active", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boxId: nextBoxId }),
    });
    if (!response.ok) {
      setError(t("errors.action"));
      setLoading(false);
      return;
    }
    setBoxes((current) => current.map((box) => ({ ...box, isActive: box.id === nextBoxId })));
    setSelectedDay(dayKey(new Date()));
    setBoxId(nextBoxId);
  }

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
    const startsAt = new Date(String(form.get("startsAt")));
    const response = await fetch(`/api/boxes/${boxId}/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name")),
        description: String(form.get("description")) || undefined,
        startsAt: startsAt.toISOString(),
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
    setSelectedDay(dayKey(startsAt));
    setShowCreateClass(false);
    await loadClasses(boxId);
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
      if (!response.ok) setError(requestMessage(data, t("errors.action")));
      else await loadClasses(boxId);
    } finally {
      setBusyId(null);
    }
  }

  function chooseDay(date: Date, index: number) {
    setSelectedDay(dayKey(date));
    dayScroller.current?.children[index]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  return (
    <div className="mt-6 space-y-4 pb-4">
      {boxes.length ? (
        <div className="sticky top-2 z-20 rounded-2xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur">
          <label htmlFor="box-selector" className="text-xs font-semibold uppercase tracking-wide text-muted">{t("selectBox")}</label>
          <div className="mt-2 flex gap-2">
            <select id="box-selector" value={boxId} onChange={(event) => void selectBox(event.target.value)} className="min-h-12 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-base">
              {boxes.map((box) => <option key={box.id} value={box.id}>{box.name}</option>)}
            </select>
            <Button type="button" variant="secondary" onClick={() => setShowJoin((value) => !value)}>{showJoin ? t("join.close") : t("join.another")}</Button>
          </div>
        </div>
      ) : null}

      {showJoin ? (
        <form onSubmit={submitBox} className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="font-bold">{t("join.title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("join.description")}</p>
          <input name="joinCode" aria-label={t("join.code")} required minLength={6} maxLength={12} autoCapitalize="characters" autoCorrect="off" placeholder={t("join.placeholder")} className="mt-4 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-center font-mono text-lg uppercase tracking-[0.15em]" />
          <Button className="mt-3 w-full">{t("join.submit")}</Button>
        </form>
      ) : null}

      {error ? <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {selectedBox ? (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold">{selectedBox.name}</h2>
              <p className="mt-1 text-sm text-muted">{t("members", { count: selectedBox._count.memberships })}</p>
            </div>
            <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">{t(`roles.${role?.toLowerCase() ?? "athlete"}`)}</span>
          </div>
          {role === "OWNER" ? <Link href="/box-admin" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent">{t("openAdministration")}</Link> : null}
        </section>
      ) : null}

      {isStaff ? <Button type="button" className="w-full" onClick={() => setShowCreateClass((value) => !value)}>{showCreateClass ? t("classForm.cancel") : t("classForm.open")}</Button> : null}
      {showCreateClass && isStaff ? <ClassForm t={t} options={options} onSubmit={submitClass} /> : null}

      <section aria-busy={loading} className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t("upcoming")}</p>
            <h2 className="mt-1 text-xl font-bold">{new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric" }).format(selectedDate)}</h2>
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

        {!loading ? <div className="space-y-3">{filteredClasses.map((session) => <ClassCard key={session.id} session={session} locale={locale} isStaff={isStaff} busy={busyId === session.id} t={t} onAction={classAction} />)}</div> : null}
      </section>
    </div>
  );
}

function ClassCard({ session, locale, isStaff, busy, t, onAction }: { session: ClassSession; locale: string; isStaff: boolean; busy: boolean; t: ReturnType<typeof useTranslations>; onAction: (id: string, method: "POST" | "PATCH" | "DELETE", suffix?: string, body?: object) => Promise<void> }) {
  const full = session.bookedCount >= session.capacity;
  const booked = Boolean(session.currentUserBooking);
  const attended = session.currentUserBooking?.status === "ATTENDED";
  const spots = Math.max(0, session.capacity - session.bookedCount);

  return (
    <article className={`overflow-hidden rounded-2xl border bg-surface shadow-sm ${booked ? "border-accent/60 ring-1 ring-accent/20" : "border-border"}`}>
      {booked ? <div className="h-1 bg-accent" /> : null}
      <div className="p-4">
        <div className="flex gap-4">
          <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-surface-elevated px-2 py-2">
            <span className="text-xl font-black leading-none">{new Intl.DateTimeFormat(locale, { hour: "numeric" }).format(new Date(session.startsAt))}</span>
            <span className="mt-1 text-[11px] font-bold uppercase text-muted">{new Intl.DateTimeFormat(locale, { minute: "2-digit" }).format(new Date(session.startsAt))}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-lg font-bold leading-tight">{session.name}</h3>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${full && !booked ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>{full && !booked ? t("full") : t("spots", { count: spots })}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{t("classMeta", { duration: session.durationMinutes, booked: session.bookedCount, capacity: session.capacity })}</p>
            {session.workout ? <p className="mt-2 text-sm font-semibold">{session.workout.name}{session.workoutVariant ? ` · ${session.workoutVariant.level.name}` : ""}</p> : null}
            {session.description ? <p className="mt-2 line-clamp-2 text-sm text-muted">{session.description}</p> : null}
          </div>
        </div>

        {!isStaff ? (
          booked ? <Button type="button" variant="secondary" disabled={busy || attended} onClick={() => void onAction(session.id, "DELETE")} className="mt-4 min-h-12 w-full">{attended ? t("attended") : t("cancelBooking")}</Button>
          : <Button type="button" disabled={full || busy} onClick={() => void onAction(session.id, "POST")} className="mt-4 min-h-12 w-full">{full ? t("full") : t("book")}</Button>
        ) : (
          <details className="mt-4 border-t border-border pt-2">
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold">{t("roster", { count: session.bookings.length })}</summary>
            <div className="space-y-2 pt-1">
              {session.bookings.map((booking) => <div key={booking.id} className="flex items-center justify-between gap-2 rounded-xl bg-background p-2.5"><span className="min-w-0 truncate text-sm">{booking.user.athleteProfile?.displayName ?? booking.user.email}</span><Button type="button" variant="secondary" disabled={busy} onClick={() => void onAction(session.id, "PATCH", "attendance", { userId: booking.userId, status: booking.status === "ATTENDED" ? "BOOKED" : "ATTENDED" })}>{booking.status === "ATTENDED" ? t("undoAttendance") : t("markAttended")}</Button></div>)}
              {!session.bookings.length ? <p className="py-2 text-sm text-muted">{t("noBookings")}</p> : null}
              <Button type="button" variant="danger" className="mt-2 w-full" disabled={busy} onClick={() => void onAction(session.id, "DELETE", "")}>{t("deleteClass")}</Button>
            </div>
          </details>
        )}
      </div>
    </article>
  );
}

function ClassSkeleton() {
  return <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((item) => <div key={item} className="animate-pulse rounded-2xl border border-border bg-surface p-4"><div className="flex gap-4"><div className="h-14 w-14 rounded-xl bg-surface-elevated" /><div className="flex-1 space-y-2"><div className="h-5 w-2/3 rounded bg-surface-elevated" /><div className="h-4 w-1/2 rounded bg-surface-elevated" /><div className="h-4 w-3/4 rounded bg-surface-elevated" /></div></div></div>)}</div>;
}

function ClassForm({ t, options, onSubmit }: { t: ReturnType<typeof useTranslations>; options: WorkoutOption[]; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const [workoutId, setWorkoutId] = useState("");
  const variants = options.find((option) => option.id === workoutId)?.variants ?? [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);
  const defaultStartsAt = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}T${String(tomorrow.getHours()).padStart(2, "0")}:${String(tomorrow.getMinutes()).padStart(2, "0")}`;

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-accent/30 bg-surface p-4 shadow-sm">
      <h2 className="text-lg font-bold">{t("classForm.title")}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold sm:col-span-2">{t("classForm.name")}<input name="name" required minLength={2} placeholder={t("classForm.name")} className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base" /></label>
        <label className="text-sm font-semibold sm:col-span-2">{t("classForm.startsAt")}<input name="startsAt" type="datetime-local" required defaultValue={defaultStartsAt} className="mt-1.5 min-h-12 w-full min-w-0 rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15" /></label>
        <label className="text-sm font-semibold">{t("classForm.duration")}<input name="durationMinutes" type="number" inputMode="numeric" min={15} max={240} defaultValue={60} required className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base" /></label>
        <label className="text-sm font-semibold">{t("classForm.capacity")}<input name="capacity" type="number" inputMode="numeric" min={1} max={200} defaultValue={12} required className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base" /></label>
        <label className="text-sm font-semibold">{t("classForm.workout")}<select name="workoutId" value={workoutId} onChange={(event) => setWorkoutId(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"><option value="">{t("classForm.noWorkout")}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
        <label className="text-sm font-semibold">{t("classForm.variation")}<select name="workoutVariantId" disabled={!workoutId} className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base disabled:opacity-50"><option value="">{t("classForm.noVariation")}</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name ?? variant.level.name}</option>)}</select></label>
        <label className="text-sm font-semibold sm:col-span-2">{t("classForm.description")}<textarea name="description" rows={3} placeholder={t("classForm.description")} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-base" /></label>
      </div>
      <Button className="mt-5 min-h-12 w-full sm:w-auto">{t("classForm.submit")}</Button>
    </form>
  );
}
