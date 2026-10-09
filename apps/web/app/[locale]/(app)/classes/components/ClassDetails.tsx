"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { formatTime, formatWeekdayDate } from "@/lib/date-formatters";
import {
  classApiPath,
  remainingSpots,
  scheduleTimeZone,
} from "@/lib/class-schedule";
import type { ClassSession, ManagedBox } from "@/lib/boxes";

export default function ClassDetails({
  session,
  box,
  onChange,
  refresh,
  page = false,
  canBook = true,
}: {
  session: ClassSession;
  box: ManagedBox;
  onChange: (session: ClassSession) => void;
  refresh: () => Promise<void>;
  page?: boolean;
  canBook?: boolean;
}) {
  const t = useTranslations("classesV7");
  const types = useTranslations("workoutTypes");
  const levels = useTranslations("workoutLevels.names");
  const locale = useLocale();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    error: boolean;
    text: string;
  } | null>(null);
  const timeZone = scheduleTimeZone(box.timezone);
  const spots = remainingSpots(session);
  const booked = Boolean(session.currentUserBooking);
  const attended = session.currentUserBooking?.status === "ATTENDED";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const started = new Date(session.startsAt).getTime() <= now;
  const disabled = busy || attended || (!booked && (spots === 0 || started));
  const end = new Date(
    new Date(session.startsAt).getTime() + session.durationMinutes * 60000,
  );

  async function book() {
    if (pending.current || disabled || !canBook) return;
    pending.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`${classApiPath(box.id, session.id)}/book`, {
        method: booked ? "DELETE" : "POST",
      });
      if (!response.ok) {
        setFeedback({
          error: true,
          text: t(response.status === 409 ? "stale" : "actionError"),
        });
        // Refresh stale capacity without losing the selected class or creating a reservation locally.
        if (response.status === 409) await refresh().catch(() => undefined);
        return;
      }
      const data = (await response.json()) as {
        id: string;
        status: "BOOKED" | "ATTENDED";
      };
      onChange({
        ...session,
        bookedCount: Math.max(0, session.bookedCount + (booked ? -1 : 1)),
        currentUserBooking: booked
          ? null
          : { id: data.id, status: data.status },
      });
      setFeedback({ error: false, text: t(booked ? "canceled" : "reserved") });
      await refresh().catch(() =>
        setFeedback({ error: true, text: t("refreshError") }),
      );
    } catch {
      setFeedback({ error: true, text: t("actionError") });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <article
      aria-labelledby={`class-title-${session.id}`}
      className={`min-w-0 space-y-5 ${page ? "pb-28 lg:pb-6" : ""}`}
    >
      <header className="space-y-2">
        <h1
          id={`class-title-${session.id}`}
          className="break-words text-2xl font-bold tracking-tight"
        >
          {session.name}
        </h1>
        <Link
          href={`/boxes/${box.id}`}
          className="inline-block break-words text-sm text-muted hover:text-foreground focus-visible:outline-accent"
        >
          {box.name}
        </Link>
        <p className="text-sm leading-6 text-muted">
          {formatWeekdayDate(session.startsAt, locale, false, { timeZone })}
          <br />
          {formatTime(session.startsAt, locale, { timeZone })} –{" "}
          {formatTime(end, locale, { timeZone })} ·{" "}
          {t("duration", { count: session.durationMinutes })}
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
        <p
          className={`text-xl font-semibold ${spots ? "text-accent" : "text-muted"}`}
        >
          {spots ? t("spots", { count: spots }) : t("full")}
        </p>
        {booked ? (
          <span className="text-xs font-medium text-muted">{t("booked")}</span>
        ) : null}
      </div>
      {session.coach?.displayName ? (
        <p className="text-sm">
          <span className="text-muted">{t("coach")}: </span>
          {session.coach.displayName}
        </p>
      ) : null}
      {box.address || box.location ? (
        <p className="break-words text-sm">
          <span className="text-muted">{t("location")}: </span>
          {box.address || box.location}
        </p>
      ) : null}
      {session.description ? (
        <p className="whitespace-pre-line break-words text-sm leading-6">
          {session.description}
        </p>
      ) : null}
      <section
        className="space-y-2 border-t border-border pt-4"
        aria-label={t("workout")}
      >
        <h2 className="text-sm font-semibold">{t("workout")}</h2>
        {session.workout ? (
          <>
            <p className="break-words font-medium">{session.workout.name}</p>
            <p className="text-sm text-muted">
              {session.workout.type
                ? types.has(session.workout.type.key.toLowerCase())
                  ? types(session.workout.type.key.toLowerCase())
                  : session.workout.type.name
                : null}
              {session.workoutVariant
                ? ` · ${levels.has(session.workoutVariant.level.key.toLowerCase()) ? levels(session.workoutVariant.level.key.toLowerCase()) : session.workoutVariant.level.name}`
                : null}
            </p>
            {session.workout.description ? (
              <p className="line-clamp-3 whitespace-pre-line break-words text-sm leading-6 text-muted">
                {session.workout.description}
              </p>
            ) : null}
            <Link
              href={`/workouts/${session.workout.id}${session.workoutVariant ? `?variation=${encodeURIComponent(session.workoutVariant.level.key)}` : ""}`}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-accent focus-visible:outline-accent"
            >
              {t("viewWorkout")} →
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted">{t("noWorkout")}</p>
        )}
      </section>
      {canBook ? (
        <footer
          data-class-action
          className={
            page
              ? "fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background px-4 py-3 lg:static lg:border-t-0 lg:px-0"
              : "sticky bottom-4 space-y-2 border-t border-border bg-background py-4"
          }
        >
          {feedback ? (
            <p
              role={feedback.error ? "alert" : "status"}
              className={`mb-2 text-sm ${feedback.error ? "text-red-400" : "text-muted"}`}
            >
              {feedback.text}
            </p>
          ) : null}
          <Button
            type="button"
            variant={booked ? "secondary" : "primary"}
            isLoading={busy}
            disabled={disabled}
            onClick={() => void book()}
            className="w-full rounded-xl lg:w-auto"
          >
            {busy
              ? t("working")
              : attended
                ? t("attended")
                : booked
                  ? t("cancel")
                  : started
                    ? t("started")
                    : spots === 0
                      ? t("full")
                      : t("book")}
          </Button>
        </footer>
      ) : null}
    </article>
  );
}
