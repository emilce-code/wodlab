import type { ClassSession } from "./boxes";

export function scheduleTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return value;
  } catch {
    return "UTC";
  }
}
export function classDayKey(value: Date | string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (name: string) =>
    parts.find((item) => item.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function classDays(timeZone: string, now = new Date()) {
  const first = new Date(`${classDayKey(now, timeZone)}T12:00:00Z`);
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(first.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}
export function visibleClasses(
  sessions: ClassSession[],
  day: string,
  mine: boolean,
  timeZone: string,
) {
  return sessions
    .filter(
      (session) =>
        classDayKey(session.startsAt, timeZone) === day &&
        (!mine || Boolean(session.currentUserBooking)),
    )
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
}
export function remainingSpots(
  session: Pick<ClassSession, "capacity" | "bookedCount">,
) {
  return Math.max(0, session.capacity - session.bookedCount);
}
export function classApiPath(boxId: string, classId: string) {
  return `/api/boxes/${encodeURIComponent(boxId)}/classes/${encodeURIComponent(classId)}`;
}
export function classDetailsPath(
  boxId: string,
  classId: string,
  day: string,
  view = "all",
) {
  return `/classes/${encodeURIComponent(boxId)}/${encodeURIComponent(classId)}?${new URLSearchParams({ day, view })}`;
}
