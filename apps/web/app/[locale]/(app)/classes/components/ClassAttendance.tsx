"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { ClassSession } from "@/lib/boxes";
import { classApiPath } from "@/lib/class-schedule";

export default function ClassAttendance({
  session,
  boxId,
  onChange,
}: {
  session: ClassSession;
  boxId: string;
  onChange: (session: ClassSession) => void;
}) {
  const t = useTranslations("classStaff");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busy = useRef(new Set<string>());
  const current = useRef(session);
  const controllers = useRef(new Map<string, AbortController>());
  useEffect(() => {
    current.current = session;
  }, [session]);
  useEffect(
    () => () => {
      for (const controller of controllers.current.values()) controller.abort();
    },
    [],
  );
  const roster = session.bookings.filter(
    (booking) => booking.status === "BOOKED" || booking.status === "ATTENDED",
  );
  const attended = roster.filter(
    (booking) => booking.status === "ATTENDED",
  ).length;
  const name = (booking: ClassSession["bookings"][number]) =>
    booking.user.athleteProfile?.displayName || booking.user.email;
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();
  const visible = roster.filter((booking) =>
    normalize(name(booking)).includes(normalize(query.trim())),
  );
  async function toggle(booking: ClassSession["bookings"][number]) {
    if (busy.current.has(booking.id)) return;
    busy.current.add(booking.id);
    setPending(new Set(busy.current));
    setErrors((value) => ({ ...value, [booking.id]: "" }));
    const controller = new AbortController();
    controllers.current.set(booking.id, controller);
    const status = booking.status === "BOOKED" ? "ATTENDED" : "BOOKED";
    try {
      const response = await fetch(
        `${classApiPath(boxId, session.id)}/attendance`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: booking.userId, status }),
          signal: controller.signal,
        },
      );
      if (!response.ok) throw new Error();
      const saved: { id: string; status: string } = await response.json();
      if (saved.id !== booking.id || saved.status !== status) throw new Error();
      if (controller.signal.aborted) return;
      const next: ClassSession = {
        ...current.current,
        bookings: current.current.bookings.map<
          ClassSession["bookings"][number]
        >((row) => (row.id === booking.id ? { ...row, status } : row)),
      };
      current.current = next;
      onChange(next);
    } catch {
      if (!controller.signal.aborted)
        setErrors((value) => ({
          ...value,
          [booking.id]: t("attendanceError"),
        }));
    } finally {
      busy.current.delete(booking.id);
      controllers.current.delete(booking.id);
      if (!controller.signal.aborted) setPending(new Set(busy.current));
    }
  }
  return (
    <section className="min-w-0 space-y-4" aria-label={t("attendance")}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t("attendance")}</h2>
        <p role="status" className="text-sm text-muted">
          <strong className="font-bold text-accent tabular-nums">
            {attended}
          </strong>{" "}
          {t("attendanceCount", { attended, booked: roster.length })}
        </p>
      </div>
      <label className="block">
        <span className="sr-only">{t("searchAthletes")}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchAthletes")}
          className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 outline-none focus:border-accent"
        />
      </label>
      <ul className="divide-y divide-border">
        {visible.map((booking) => (
          <li key={booking.id} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold">
                  {name(booking)}
                </p>
                <Badge
                  variant={booking.status === "ATTENDED" ? "accent" : "default"}
                  className="mt-1"
                >
                  {t(booking.status === "ATTENDED" ? "attended" : "booked")}
                </Badge>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-3"
                aria-label={`${t(booking.status === "ATTENDED" ? "undo" : "markAttended")}: ${name(booking)}`}
                isLoading={pending.has(booking.id)}
                onClick={() => void toggle(booking)}
              >
                {t(booking.status === "ATTENDED" ? "undo" : "markAttended")}
              </Button>
            </div>
            {errors[booking.id] ? (
              <Alert variant="error" className="mt-2 text-xs">
                {errors[booking.id]}
              </Alert>
            ) : null}
          </li>
        ))}
      </ul>
      {!visible.length ? (
        <p className="py-4 text-sm text-muted">
          {t(roster.length ? "noMatches" : "noBookings")}
        </p>
      ) : null}
    </section>
  );
}
