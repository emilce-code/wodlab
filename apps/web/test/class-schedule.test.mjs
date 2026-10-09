import assert from "node:assert/strict";
import { test } from "node:test";
import {
  classDayKey,
  classDays,
  visibleClasses,
  remainingSpots,
  scheduleTimeZone,
  classApiPath,
  classDetailsPath,
} from "../lib/class-schedule.ts";

test("schedule uses the box calendar, including midnight and DST boundaries", () => {
  assert.equal(
    classDayKey("2026-10-10T01:00:00Z", "America/Asuncion"),
    "2026-10-09",
  );
  const days = classDays("America/New_York", new Date("2026-03-08T02:00:00Z"));
  assert.equal(days[0], "2026-03-07");
  assert.deepEqual(days.slice(0, 4), [
    "2026-03-07",
    "2026-03-08",
    "2026-03-09",
    "2026-03-10",
  ]);
  assert.equal(days.length, 30);
  assert.equal(scheduleTimeZone("legacy-invalid"), "UTC");
});
test("day and booking filters keep chronological order without mutating source data", () => {
  const sessions = [
    {
      id: "late",
      startsAt: "2026-10-10T01:00:00Z",
      currentUserBooking: { id: "b", status: "BOOKED" },
    },
    { id: "early", startsAt: "2026-10-09T18:00:00Z", currentUserBooking: null },
    {
      id: "next",
      startsAt: "2026-10-10T16:00:00Z",
      currentUserBooking: { id: "c", status: "ATTENDED" },
    },
  ];
  assert.deepEqual(
    visibleClasses(sessions, "2026-10-09", false, "America/Asuncion").map(
      (s) => s.id,
    ),
    ["early", "late"],
  );
  assert.deepEqual(
    visibleClasses(sessions, "2026-10-09", true, "America/Asuncion").map(
      (s) => s.id,
    ),
    ["late"],
  );
  assert.deepEqual(
    visibleClasses(sessions, "2026-10-11", true, "America/Asuncion"),
    [],
  );
  assert.deepEqual(
    sessions.map((s) => s.id),
    ["late", "early", "next"],
  );
});
test("availability never becomes negative and routes preserve box/class/filter identity", () => {
  assert.equal(remainingSpots({ capacity: 10, bookedCount: 8 }), 2);
  assert.equal(remainingSpots({ capacity: 10, bookedCount: 11 }), 0);
  assert.equal(
    classApiPath("box/one", "class/two"),
    "/api/boxes/box%2Fone/classes/class%2Ftwo",
  );
  assert.equal(
    classDetailsPath("box", "class", "2026-10-09", "mine"),
    "/classes/box/class?day=2026-10-09&view=mine",
  );
});
