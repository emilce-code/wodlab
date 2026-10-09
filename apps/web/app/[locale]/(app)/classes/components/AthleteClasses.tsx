"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import {
  classDays,
  classDetailsPath,
  remainingSpots,
  scheduleTimeZone,
  visibleClasses,
} from "@/lib/class-schedule";
import { formatTime, formatWeekdayDate } from "@/lib/date-formatters";
import type { BoxSummary, ClassSession } from "@/lib/boxes";
import ClassDetails from "./ClassDetails";

export default function AthleteClasses({
  box,
  initialDay,
  initialView,
  joinAction,
}: {
  box: BoxSummary;
  initialDay?: string;
  initialView?: string;
  joinAction?: ReactNode;
}) {
  const t = useTranslations("classesV7");
  const locale = useLocale();
  const timeZone = scheduleTimeZone(box.timezone);
  const days = useMemo(() => classDays(timeZone), [timeZone]);
  const [day, setDay] = useState(
    initialDay && days.includes(initialDay) ? initialDay : days[0],
  );
  const [mine, setMine] = useState(initialView === "mine");
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const requestId = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const current = visibleClasses(classes, day, mine, timeZone);
  const selected = current.find((session) => session.id === selectedId) ?? null;
  const endpoint = useMemo(() => {
    const from = new Date(`${days[0]}T00:00:00Z`);
    from.setUTCDate(from.getUTCDate() - 1);
    const to = new Date(from);
    to.setUTCDate(from.getUTCDate() + 32);
    return `/api/boxes/${encodeURIComponent(box.id)}/classes?${new URLSearchParams({ from: from.toISOString(), to: to.toISOString() })}`;
  }, [box.id, days]);

  const load = useCallback(
    async (signal?: AbortSignal, silent = false) => {
      const id = ++requestId.current;
      try {
        const response = await fetch(endpoint, { signal, cache: "no-store" });
        if (!response.ok) throw Error();
        const data = (await response.json()) as { classes: ClassSession[] };
        if (id === requestId.current && !signal?.aborted) {
          setClasses(data.classes);
          setError(false);
        }
      } catch (caught) {
        if (signal?.aborted) return;
        if (id === requestId.current) setError(true);
        if (silent) throw caught;
      } finally {
        if (id === requestId.current && !signal?.aborted) setLoading(false);
      }
    },
    [endpoint],
  );
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => {
      controller.abort();
    };
  }, [load]);

  useEffect(() => {
    scroller.current
      ?.querySelector("[aria-pressed=true]")
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, []);

  function selectDay(next: string, index: number) {
    setDay(next);
    setSelectedId(null);
    scroller.current?.children[index]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      inline: "center",
      block: "nearest",
    });
  }
  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <Link
            href={`/boxes/${box.id}`}
            className="mt-1 inline-block text-sm text-muted hover:text-foreground"
          >
            {box.name}
          </Link>
        </div>
        {joinAction}
      </header>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section
          className="min-w-0 space-y-4"
          aria-label={t("schedule")}
          aria-busy={loading}
        >
          <div
            ref={scroller}
            className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]"
            aria-label={t("dates")}
          >
            {days.map((value, index) => (
              <button
                key={value}
                type="button"
                aria-pressed={value === day}
                aria-label={formatWeekdayDate(
                  `${value}T12:00:00Z`,
                  locale,
                  false,
                  { timeZone: "UTC" },
                )}
                onClick={() => selectDay(value, index)}
                className={`min-h-14 w-14 shrink-0 rounded-xl border px-2 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent ${value === day ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-muted"}`}
              >
                <span className="block text-xs">
                  {new Intl.DateTimeFormat(locale, {
                    weekday: "short",
                    timeZone: "UTC",
                  }).format(new Date(`${value}T12:00:00Z`))}
                </span>
                <span className="block text-base font-semibold">
                  {Number(value.slice(-2))}
                </span>
              </button>
            ))}
          </div>
          <div
            aria-label={t("filter")}
            className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1"
          >
            {[false, true].map((value) => (
              <button
                key={String(value)}
                type="button"
                aria-pressed={mine === value}
                onClick={() => {
                  setMine(value);
                  setSelectedId(null);
                }}
                className={`min-h-11 rounded-lg px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${mine === value ? "bg-surface-elevated text-accent" : "text-muted"}`}
              >
                {t(value ? "mine" : "all")}
              </button>
            ))}
          </div>
          <h2 className="text-sm font-semibold">
            {formatWeekdayDate(`${day}T12:00:00Z`, locale, false, {
              timeZone: "UTC",
            })}
          </h2>
          {loading ? (
            <p role="status" className="py-6 text-sm text-muted">
              {t("loading")}
            </p>
          ) : null}
          {error ? (
            <div role="alert" className="space-y-2">
              <p className="text-sm text-red-400">{t("loadError")}</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  void load();
                }}
              >
                {t("retry")}
              </Button>
            </div>
          ) : null}
          {!loading && !error && !current.length ? (
            <p className="py-6 text-sm text-muted">
              {t(mine ? "emptyMine" : "empty")}
            </p>
          ) : null}
          {!loading ? (
            <ul className="space-y-2">
              {current.map((session) => (
                <li key={session.id}>
                  <Link
                    href={classDetailsPath(
                      box.id,
                      session.id,
                      day,
                      mine ? "mine" : "all",
                    )}
                    aria-current={
                      selectedId === session.id ? "true" : undefined
                    }
                    onClick={(event) => {
                      if (
                        !event.ctrlKey &&
                        !event.metaKey &&
                        !event.shiftKey &&
                        !event.altKey &&
                        window.matchMedia("(min-width: 1024px)").matches
                      ) {
                        event.preventDefault();
                        setSelectedId(session.id);
                      }
                    }}
                    className={`flex min-h-24 gap-3 rounded-xl border px-3 py-3 transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none ${selectedId === session.id ? "border-accent/50 bg-accent/5" : "border-border/60 bg-surface"}`}
                  >
                    <time
                      dateTime={session.startsAt}
                      className="w-16 shrink-0 text-sm font-semibold"
                    >
                      {formatTime(session.startsAt, locale, { timeZone })}
                    </time>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="break-words text-sm font-semibold">
                        {session.name}
                      </h3>
                      <p className="break-words text-xs text-muted">
                        {t("duration", { count: session.durationMinutes })} ·{" "}
                        {box.name}
                        {box.location ? ` · ${box.location}` : ""}
                      </p>
                      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        <span
                          className={
                            remainingSpots(session)
                              ? "text-foreground"
                              : "text-muted"
                          }
                        >
                          {remainingSpots(session)
                            ? t("spots", { count: remainingSpots(session) })
                            : t("full")}
                        </span>
                        {session.currentUserBooking ? (
                          <span className="text-muted">{t("booked")}</span>
                        ) : null}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
        <section
          className="hidden min-w-0 border-l border-border pl-6 lg:block"
          aria-label={t("details")}
        >
          {selected ? (
            <ClassDetails
              key={selected.id}
              session={selected}
              box={box}
              onChange={(next) =>
                setClasses((previous) =>
                  previous.map((item) => (item.id === next.id ? next : item)),
                )
              }
              refresh={() => load(undefined, true)}
            />
          ) : (
            <p className="py-8 text-sm text-muted">{t("selectClass")}</p>
          )}
        </section>
      </div>
    </div>
  );
}
