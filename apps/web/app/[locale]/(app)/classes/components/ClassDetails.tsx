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
import NavigationIcon from "@/components/layout/NavigationIcon";
import BoxDetailsIcon from "@/components/ui/BoxDetailsIcon";
import ClassIcon from "./ClassIcon";

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
  const hasDetails = Boolean(
    session.coach?.displayName || box.address || box.location,
  );
  const workoutType = session.workout?.type;
  const level = session.workoutVariant?.level;
  const workoutMetadata = [
    workoutType
      ? types.has(workoutType.key.toLowerCase())
        ? types(workoutType.key.toLowerCase())
        : workoutType.name
      : null,
    level
      ? levels.has(level.key.toLowerCase())
        ? levels(level.key.toLowerCase())
        : level.name
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <article
      aria-labelledby={`class-title-${session.id}`}
      className={`grid min-w-0 gap-4 ${page ? (canBook ? "pb-28 lg:pb-6" : "pb-4") : "xl:grid-cols-2"}`}
    >
      <header
        className={`space-y-3 ${!page ? "xl:col-start-1 xl:row-start-1 xl:row-span-2" : ""}`}
      >
        <div className="flex items-center gap-3">
          <ClassIcon large full={spots === 0 && !booked} />
          <div className="min-w-0 space-y-1">
            <h1
              id={`class-title-${session.id}`}
              className="break-words text-xl font-extrabold tracking-tight"
            >
              {session.name}
            </h1>
            <Link
              href={`/boxes/${box.id}`}
              className="inline-block break-words text-sm text-muted hover:text-foreground focus-visible:outline-accent"
            >
              {box.name}
            </Link>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm leading-5 text-muted">
          <NavigationIcon name="training" className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            {formatWeekdayDate(session.startsAt, locale, false, { timeZone })}
            <br />
            {formatTime(session.startsAt, locale, { timeZone })} –{" "}
            {formatTime(end, locale, { timeZone })} (
            {t("duration", { count: session.durationMinutes })})
          </p>
        </div>
      </header>
      <div
        className={`flex min-w-0 flex-wrap items-center gap-2 rounded-xl border p-3 ${!spots && !booked ? "border-red-500/25 bg-red-500/5" : "border-border bg-surface"} ${!page ? "xl:col-start-2 xl:row-start-2 xl:justify-end xl:border-0 xl:bg-transparent xl:p-0" : ""}`}
        aria-label={spots ? t("spots", { count: spots }) : t("full")}
      >
        <NavigationIcon
          name="coach"
          className={`h-5 w-5 shrink-0 text-muted ${!page ? "xl:hidden" : ""}`}
        />
        {spots ? (
          <>
            <strong
              className={`text-2xl font-extrabold tracking-tight text-accent tabular-nums ${!page ? "xl:text-lg" : ""}`}
            >
              {spots}
            </strong>
            <span className="text-sm font-medium">
              {t("spotsLabel", { count: spots })}
            </span>
          </>
        ) : (
          <p className="text-sm font-semibold text-red-400">{t("full")}</p>
        )}
        {booked ? (
          <span className="ml-auto text-xs text-muted">{t("booked")}</span>
        ) : null}
      </div>
      {hasDetails ? (
        <div
          className={`space-y-4 ${!page ? `xl:col-start-1 xl:row-start-3 xl:border-t xl:border-border xl:pt-4 ${!session.description ? "xl:col-span-2" : ""}` : ""}`}
        >
          {session.coach?.displayName ? (
            <div className="flex items-start gap-3">
              <NavigationIcon
                name="account"
                className="h-6 w-6 shrink-0 text-muted"
              />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">{t("coach")}</h2>
                <p className="mt-1 break-words text-sm text-muted">
                  {session.coach.displayName}
                </p>
              </div>
            </div>
          ) : null}
          {box.address || box.location ? (
            <div className="flex items-start gap-3">
              <BoxDetailsIcon
                name="location"
                className="h-6 w-6 shrink-0 text-muted"
              />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">{t("location")}</h2>
                <p className="mt-1 break-words text-sm leading-5 text-muted">
                  {box.address || box.location}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <section
        className={`min-w-0 space-y-2 ${session.workout ? "rounded-xl border border-border bg-surface p-3" : "border-t border-border pt-3"} ${!page ? `xl:col-span-2 xl:rounded-none xl:border-x-0 xl:border-b-0 xl:bg-transparent xl:px-0 ${hasDetails || session.description ? "xl:row-start-4" : "xl:row-start-3"}` : ""}`}
        aria-label={t("workout")}
      >
        <h2 className={session.workout ? "text-sm font-semibold" : "sr-only"}>
          {t("workout")}
        </h2>
        {session.workout ? (
          <Link
            href={`/workouts/${session.workout.id}${session.workoutVariant ? `?variation=${encodeURIComponent(session.workoutVariant.level.key)}` : ""}`}
            aria-label={`${t("viewWorkout")}: ${session.workout.name}`}
            className="group flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-accent"
          >
            <NavigationIcon
              name="workouts"
              className="h-8 w-8 shrink-0 rounded-lg border border-accent/20 bg-accent/10 p-1.5 text-accent"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="break-words text-base font-bold tracking-tight group-hover:text-accent">
                {session.workout.name}
              </p>
              {workoutMetadata ? (
                <p className="text-xs text-muted">{workoutMetadata}</p>
              ) : null}
              {session.workout.description ? (
                <p className="line-clamp-2 whitespace-pre-line break-words text-sm leading-5 text-muted">
                  {session.workout.description}
                </p>
              ) : null}
            </div>
            <BoxDetailsIcon
              name="chevron"
              className="h-4 w-4 shrink-0 text-accent"
            />
          </Link>
        ) : (
          <p className="text-sm leading-5 text-muted">{t("noWorkout")}</p>
        )}
      </section>
      {session.description ? (
        <section
          className={`min-w-0 space-y-1 ${!page ? `${hasDetails ? "xl:col-start-2" : "xl:col-span-2"} xl:row-start-3 xl:border-t xl:border-border xl:pt-4` : ""}`}
        >
          <h2 className="text-sm font-semibold">{t("about")}</h2>
          <p className="whitespace-pre-line break-words text-sm leading-5 text-muted">
            {session.description}
          </p>
        </section>
      ) : null}
      {canBook ? (
        <footer
          data-class-action
          className={
            page
              ? "fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background px-4 pt-3 pb-4 lg:static lg:border-t-0 lg:px-0"
              : "sticky bottom-4 space-y-2 border-t border-border bg-background py-4 xl:static xl:col-start-2 xl:row-start-1 xl:flex xl:flex-col xl:items-end xl:space-y-0 xl:self-start xl:border-t-0 xl:bg-transparent xl:p-0"
          }
        >
          {feedback ? (
            <p
              role={feedback.error ? "alert" : "status"}
              className={`mb-2 text-sm xl:order-2 xl:mt-2 xl:mb-0 ${feedback.error ? "text-red-400" : "text-muted"}`}
            >
              {feedback.text}
            </p>
          ) : null}
          <Button
            type="button"
            variant={
              booked
                ? "danger"
                : spots === 0 || started
                  ? "secondary"
                  : "primary"
            }
            isLoading={busy}
            disabled={disabled}
            onClick={() => void book()}
            className="w-full rounded-xl font-bold lg:w-auto"
          >
            {booked && !busy && !attended ? (
              <BoxDetailsIcon name="trash" className="h-4 w-4" />
            ) : null}
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
