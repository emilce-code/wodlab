"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import type { BoxSummary, ClassSession } from "@/lib/boxes";
import {
  classDays,
  classDetailsPath,
  classDayKey,
  scheduleTimeZone,
  visibleClasses,
} from "@/lib/class-schedule";
import { formatTime, formatWeekdayDate } from "@/lib/date-formatters";
import ClassDetails from "./ClassDetails";
import ClassIcon from "./ClassIcon";
import ClassEditor from "./ClassEditor";
import ClassAttendance from "./ClassAttendance";
import StaffClassActions, { type StaffMode } from "./StaffClassActions";

export default function StaffClasses({
  box,
  initialDay,
}: {
  box: BoxSummary;
  initialDay?: string;
}) {
  const t = useTranslations("classStaff");
  const boxesT = useTranslations("boxes");
  const locale = useLocale();
  const timeZone = scheduleTimeZone(box.timezone);
  const days = classDays(timeZone);
  const [day, setDay] = useState(
    initialDay && days.includes(initialDay) ? initialDay : days[0],
  );
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<StaffMode>("details");
  const [notice, setNotice] = useState("");
  const guard = useRef(() => true);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const from = new Date();
      from.setUTCDate(from.getUTCDate() - 1);
      const to = new Date(from);
      to.setUTCDate(to.getUTCDate() + 32);
      try {
        const response = await fetch(
          `/api/boxes/${encodeURIComponent(box.id)}/classes?${new URLSearchParams({ from: from.toISOString(), to: to.toISOString() })}`,
          { signal, cache: "no-store" },
        );
        if (!response.ok) throw Error();
        const data: { role: string; classes: ClassSession[] } =
          await response.json();
        if (data.role !== "OWNER" && data.role !== "COACH") throw Error();
        if (!signal?.aborted) {
          setClasses(
            data.classes.map((session) => ({ ...session, role: box.role })),
          );
          setError(false);
        }
      } catch {
        if (!signal?.aborted) setError(true);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [box.id, box.role],
  );
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);
  const current = visibleClasses(classes, day, false, timeZone);
  const selected = classes.find((session) => session.id === selectedId);
  function change(next: ClassSession) {
    setClasses((old) =>
      old.map((session) => (session.id === next.id ? next : session)),
    );
  }
  function open(next: StaffMode) {
    if (guard.current()) setMode(next);
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{boxesT("upcoming")}</h2>
        <Link
          href="/classes/schedule"
          className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground focus-visible:outline-2 focus-visible:outline-accent"
        >
          {boxesT("classForm.open")}
        </Link>
      </div>
      {notice ? (
        <p role="status" className="text-sm text-accent">
          {notice}
        </p>
      ) : null}
      <div className="grid min-w-0 gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section
          className="min-w-0 space-y-4"
          aria-label={t("schedule")}
          aria-busy={loading}
        >
          <div
            className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]"
            aria-label={t("dates")}
          >
            {days.map((value) => (
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
                onClick={() => {
                  if (guard.current()) {
                    setDay(value);
                    setSelectedId(null);
                    setMode("details");
                  }
                }}
                className={`flex min-h-14 min-w-11 shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 text-sm focus-visible:outline-2 focus-visible:outline-accent ${value === day ? "bg-accent text-accent-foreground" : "text-muted hover:bg-surface"}`}
              >
                <span className="text-xs">
                  {new Intl.DateTimeFormat(locale, {
                    weekday: "short",
                    timeZone: "UTC",
                  }).format(new Date(`${value}T12:00:00Z`))}
                </span>
                <strong className="tabular-nums">
                  {Number(value.slice(-2))}
                </strong>
              </button>
            ))}
          </div>
          {loading ? (
            <p role="status" className="py-6 text-sm text-muted">
              {t("loading")}
            </p>
          ) : error ? (
            <div role="alert" className="space-y-2">
              <p className="text-sm text-red-400">{t("loadError")}</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setLoading(true);
                  void load();
                }}
              >
                {t("retry")}
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {current.map((session) => (
                <li key={session.id}>
                  <Link
                    data-class-context
                    href={classDetailsPath(box.id, session.id, day)}
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
                        if (guard.current()) {
                          setSelectedId(session.id);
                          setMode("details");
                        }
                      }
                    }}
                    className={`flex min-h-20 items-center gap-3 rounded-xl border bg-surface px-3 py-3 focus-visible:outline-2 focus-visible:outline-accent ${selectedId === session.id ? "border-accent/60" : "border-border hover:bg-surface-elevated"}`}
                  >
                    <ClassIcon />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold tabular-nums">
                        {formatTime(session.startsAt, locale, { timeZone })}
                      </p>
                      <h3 className="break-words text-sm font-semibold">
                        {session.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        {boxesT("durationValue", {
                          duration: session.durationMinutes,
                        })}{" "}
                        · {boxesT("bookedLabel")}: {session.bookedCount}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!loading && !error && !current.length ? (
            <p className="py-6 text-sm text-muted">{boxesT("empty")}</p>
          ) : null}
        </section>
        <section
          className="hidden min-w-0 space-y-4 border-l border-border pl-5 lg:block"
          aria-label={t("workspace")}
        >
          {selected ? (
            <>
              {mode !== "details" ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => open("details")}
                  >
                    {t("backDetails")}
                  </Button>
                  <header className="space-y-1">
                    <h2 className="break-words text-xl font-bold">
                      {selected.name}
                    </h2>
                    <p className="text-sm text-muted">
                      {box.name} ·{" "}
                      {formatWeekdayDate(selected.startsAt, locale, false, {
                        timeZone,
                      })}{" "}
                      · {formatTime(selected.startsAt, locale, { timeZone })}
                    </p>
                    <p className="text-xs text-muted">
                      {boxesT("classMeta", {
                        duration: selected.durationMinutes,
                        booked: selected.bookedCount,
                        capacity: selected.capacity,
                      })}
                    </p>
                  </header>
                </>
              ) : null}
              {mode === "details" ? (
                <>
                  <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <div className="min-w-0">
                      <ClassDetails
                        session={selected}
                        box={box}
                        onChange={change}
                        refresh={async () => {
                          await load();
                        }}
                        canBook={false}
                        page
                      />
                      <StaffClassActions
                        boxId={box.id}
                        classId={selected.id}
                        day={day}
                        onOpen={open}
                      />
                    </div>
                    <div className="hidden min-w-0 border-l border-border pl-4 xl:block">
                      <ClassAttendance
                        key={selected.id}
                        session={selected}
                        boxId={box.id}
                        onChange={change}
                      />
                    </div>
                  </div>
                </>
              ) : mode === "edit" ? (
                <ClassEditor
                  key={selected.id}
                  session={selected}
                  boxId={box.id}
                  guardRef={guard}
                  onChange={(next) => {
                    change(next);
                    setDay(classDayKey(next.startsAt, timeZone));
                  }}
                  onDelete={() => {
                    setClasses((old) =>
                      old.filter((session) => session.id !== selected.id),
                    );
                    setSelectedId(null);
                    setMode("details");
                    setNotice(t("deleted"));
                  }}
                />
              ) : (
                <ClassAttendance
                  key={selected.id}
                  session={selected}
                  boxId={box.id}
                  onChange={change}
                />
              )}
            </>
          ) : (
            <p className="py-6 text-sm text-muted">{t("selectClass")}</p>
          )}
        </section>
      </div>
    </div>
  );
}
