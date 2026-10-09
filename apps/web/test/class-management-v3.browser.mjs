// Real Next.js critical-flow browser tests. Uses an ephemeral SDK-encrypted local test session
// and a local HTTP API/storage fixture. Never changes production auth code, never
// calls live Auth0/Supabase, and never stores real credentials in artifacts.
// Run: WODLY_PLAYWRIGHT_MODULE=<external package entry> node test/class-management-v3.browser.mjs
// Optional numeric viewport argument runs the responsive checks at that width only.
// Optional WODLY_CAPTURE=1 stores internal review images in the system temp directory.
import http from "node:http";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.WODLY_PLAYWRIGHT_MODULE || "playwright-core"
);

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { encrypt } = await import(
  pathToFileURL(
    path.join(web, "node_modules/@auth0/nextjs-auth0/dist/server/cookies.js"),
  ).href
);
const phase = "classes-v3";
if (!/^[a-zA-Z0-9_-]+$/.test(phase))
  throw Error("Use a simple evidence directory name");
const root = path.resolve(
  process.env.WODLY_VISUAL_OUTPUT || path.join(tmpdir(), `wodly-${phase}`),
);
await mkdir(root, { recursive: true });
const secret = randomBytes(32).toString("hex");
const fixture = {
  id: "visual-box",
  name: "CrossFit Central",
  organization: { id: "visual-org", name: "Central Fitness Group" },
  location: "Asunción, Paraguay",
  description:
    "A community-focused training space for athletes of all levels. Strength, fitness and community.",
  address: "Av. España 1234, Asunción",
  latitude: -25.2811,
  longitude: -57.6037,
  timezone: "America/Asuncion",
  logoPath: "boxes/visual-box/logo.webp",
  coverImagePath: null,
  supportContact: null,
  whatsapp: "+595981123456",
  phone: "+59521123456",
  email: "info@crossfitcentral.com",
  instagram: "@crossfitcentral",
  website: "https://crossfitcentral.com",
  role: "ATHLETE",
  isActive: true,
  joinCode: "VISUALQA",
  _count: { memberships: 32, classes: 8 },
};
const day = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const sample = (id, name, hour, extra = {}) => ({
  id,
  boxId: fixture.id,
  name,
  startsAt: `${day}T${hour}:00:00Z`,
  durationMinutes: 60,
  capacity: 10,
  bookedCount: 3,
  currentUserBooking: null,
  description: null,
  workout: null,
  workoutVariant: null,
  bookings: [],
  ...extra,
});
const workouts = [
  {
    id: "workout-1",
    name: "Fran",
    variants: [{ id: "fran-rx", name: null, level: { key: "RX", name: "Rx" } }],
  },
  {
    id: "murph",
    name: "Murph",
    variants: [
      { id: "murph-rx", name: null, level: { key: "RX", name: "Rx" } },
    ],
  },
  { id: "open-gym", name: "Open Gym", variants: [] },
];
const roster = [
  {
    id: "booking-ana",
    userId: "ana",
    status: "BOOKED",
    user: {
      email: "ana@example.com",
      athleteProfile: { displayName: "Ana Torres" },
    },
  },
  {
    id: "booking-bob",
    userId: "bob",
    status: "ATTENDED",
    user: {
      email: "bob@example.com",
      athleteProfile: { displayName: "Carlos Mendez" },
    },
  },
  {
    id: "booking-cara",
    userId: "cara",
    status: "BOOKED",
    user: {
      email: "cara@example.com",
      athleteProfile: { displayName: "Mariana Costa" },
    },
  },
];
const initial = [
  sample("strength", "Strength & Conditioning", "18", {
    bookedCount: 3,
    description: "Build strength and move well.",
    workout: {
      id: "workout-1",
      name: "Fran",
      type: { key: "FOR_TIME", name: "For Time" },
    },
    workoutVariant: workouts[0].variants[0],
    bookings: roster,
  }),
  sample("empty", "Open training", "19", { bookedCount: 0 }),
];
let sessions = structuredClone(initial),
  failure = 0,
  failRead = false,
  writes = [],
  attendanceWrites = [],
  gate = null,
  release = null,
  conflict = false;
const api = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const [actor, locale = "en"] = (req.headers.authorization || "")
    .replace("Bearer ", "")
    .split(":");
  const role =
    actor === "coach" ? "COACH" : actor === "owner" ? "OWNER" : "ATHLETE";
  res.setHeader("Content-Type", "application/json");
  const send = (data) => res.end(JSON.stringify(data));
  if (url.pathname === "/me")
    return send({
      id: "visual-" + actor,
      email: actor + "@example.com",
      role: "USER",
      permissions: [
        "athlete:use",
        ...(role !== "ATHLETE" ? ["box:manage"] : []),
      ],
      preferredLocale: locale,
      athleteProfile: {
        id: "profile",
        displayName: "Test Athlete",
        preferredWeightUnit: "KG",
        leaderboardEnabled: false,
        avatarPath: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  if (url.pathname === "/boxes") return send([{ ...fixture, role }]);
  if (url.pathname === "/boxes/managed")
    return send(role !== "ATHLETE" ? [fixture] : []);
  if (url.pathname === "/boxes/visual-box") return send({ ...fixture, role });
  if (url.pathname === "/boxes/visual-box/options") return send(workouts);
  if (url.pathname === "/boxes/visual-box/classes") {
    if (failRead) {
      res.statusCode = 503;
      return send({});
    }
    return send({
      role,
      classes: sessions.map((s) => ({
        ...s,
        bookings: role === "ATHLETE" ? [] : s.bookings,
      })),
    });
  }
  const match = url.pathname.match(
    /^\/boxes\/visual-box\/classes\/([^/]+)(\/attendance)?$/,
  );
  if (match) {
    const session = sessions.find((s) => s.id === match[1]);
    if (!session) {
      res.statusCode = 404;
      return send({});
    }
    if (req.method === "GET") {
      if (failRead) {
        res.statusCode = 503;
        return send({});
      }
      return send({
        ...session,
        role,
        bookings: role === "ATHLETE" ? [] : session.bookings,
      });
    }
    if (role === "ATHLETE") {
      res.statusCode = 403;
      return send({});
    }
    let body = {};
    if (req.method === "PATCH") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString());
    }
    if (match[2]) {
      attendanceWrites.push(body);
      if (gate) await gate;
      if (failure) {
        res.statusCode = failure;
        return send({});
      }
      const row = session.bookings.find((row) => row.userId === body.userId);
      if (!row) {
        res.statusCode = 404;
        return send({});
      }
      row.status = body.status;
      return send(row);
    }
    writes.push({ method: req.method, id: session.id, body });
    if (gate) await gate;
    if (conflict && body.startsAt) {
      session.bookings = [structuredClone(roster[0])];
      session.bookedCount = 1;
      conflict = false;
      res.statusCode = 409;
      return send({});
    }
    if (failure) {
      res.statusCode = failure;
      return send({});
    }
    if (req.method === "DELETE") {
      if (session.bookings.some((b) => b.status === "ATTENDED")) {
        res.statusCode = 409;
        return send({});
      }
      sessions = sessions.filter((s) => s.id !== session.id);
      return send({ deleted: true });
    }
    if (body.startsAt && session.bookings.length) {
      res.statusCode = 409;
      return send({});
    }
    if (body.startsAt) session.startsAt = body.startsAt;
    if ("description" in body) session.description = body.description;
    if ("workoutId" in body)
      session.workout = workouts.find((w) => w.id === body.workoutId) || null;
    if ("workoutVariantId" in body)
      session.workoutVariant =
        session.workout?.variants?.find(
          (v) => v.id === body.workoutVariantId,
        ) || null;
    return send(session);
  }
  if (url.pathname.includes("notifications"))
    return send({ items: [], unreadCount: 0 });
  if (url.pathname.includes("workouts")) return send([]);
  res.statusCode = 404;
  send({});
});
await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
const apiUrl = `http://127.0.0.1:${api.address().port}`;
const port = process.env.WODLY_VISUAL_PORT || "3100";
const origin = `http://localhost:${port}`;
const log = await import("node:fs");
const logStream = log.createWriteStream(path.join(root, "next-runtime.log"));
const child = spawn(
  process.execPath,
  [web + "/node_modules/next/dist/bin/next", "dev", "--port", port],
  {
    cwd: web,
    detached: true,
    env: {
      ...process.env,
      API_URL: apiUrl,
      APP_BASE_URL: origin,
      AUTH0_DOMAIN: "visual-qa.example.invalid",
      AUTH0_CLIENT_ID: "visual-qa-fixture",
      AUTH0_CLIENT_SECRET: "visual-qa-fixture",
      AUTH0_AUDIENCE: "visual-qa",
      AUTH0_SECRET: secret,
      NEXT_PUBLIC_SUPABASE_URL: apiUrl,
      SUPABASE_URL: apiUrl,
      SUPABASE_SERVICE_ROLE_KEY: "fixture-only",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
child.stdout.pipe(logStream);
child.stderr.pipe(logStream);
let browser;
try {
  for (let n = 0; n < 80; n++) {
    try {
      if ((await fetch(origin + "/manifest.webmanifest")).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({
    executablePath: process.env.WODLY_CHROMIUM || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  async function pageFor(actor, locale, viewport) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      timezoneId: "America/Asuncion",
    });
    const now = Math.floor(Date.now() / 1000);
    const session = await encrypt(
      {
        user: {
          sub: "visual-" + actor,
          name: "Visual QA",
          email: actor + "@example.com",
        },
        tokenSet: {
          accessToken: actor + ":" + locale,
          scope: "openid profile email",
          expiresAt: now + 3600,
        },
        internal: { sid: "visual-" + actor, createdAt: now },
      },
      secret,
      now + 3600,
    );
    await context.addCookies([
      {
        name: "__session",
        value: session,
        url: origin,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);
    page.on("pageerror", (e) => {
      errors.push(e.message);
      console.error(e.message);
    });
    // Maps are intentionally blocked: directions must remain usable and no fake map is substituted.
    await page.route("https://www.google.com/**", (route) => route.abort());
    return { context, page };
  }

  const assert = (value, message) => {
    if (!value) throw Error(message);
  };
  async function navigate(page, locale = "en", route = `/classes?day=${day}`) {
    await page.goto(origin + "/" + locale + route, {
      waitUntil: "domcontentloaded",
    });
    await page.addStyleTag({
      content: "nextjs-portal{display:none !important}",
    });
  }
  const messages = JSON.parse(
    await readFile(web + "/messages/en.json", "utf8"),
  );
  const t = messages.classStaff,
    picker = messages.boxes.schedule;
  async function checkLayout(page, width, label) {
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow ${label}`,
    );
    const nav = page.locator("nav.fixed");
    assert((await nav.isVisible()) === width < 1024, `Navigation ${label}`);
    if (width < 1024) {
      const navigationRect = await nav.boundingBox();
      assert(
        navigationRect.y >= 0 &&
          navigationRect.y + navigationRect.height <=
            page.viewportSize().height + 1,
        "Bottom navigation is outside the viewport",
      );
      assert(
        (await nav
          .getByRole("button", { name: "Classes", exact: true })
          .getAttribute("aria-current")) === "page",
        "Classes not active",
      );
      const footer = page.locator("[data-class-action]");
      if (await footer.count()) {
        const rect = await footer.boundingBox(),
          bar = await nav.boundingBox();
        assert(rect.y + rect.height <= bar.y + 1, "Save overlaps navigation");
      }
    } else
      assert(
        await page.locator("aside").first().isVisible(),
        "Sidebar missing",
      );
    if (process.env.WODLY_CAPTURE === "1")
      await page.screenshot({ path: path.join(root, label + ".png") });
  }
  const widths = [375, 390, 430, 768, 1024, 1440].filter(
    (width) => !Number(process.argv[2]) || width === Number(process.argv[2]),
  );
  for (const width of widths) {
    sessions = structuredClone(initial);
    failure = 0;
    writes = [];
    attendanceWrites = [];
    gate = null;
    const { page, context } = await pageFor(
      width === 1440 ? "coach" : "owner",
      "en",
      {
        width,
        height:
          width === 375
            ? 812
            : width === 390
              ? 844
              : width === 430
                ? 932
                : width === 768
                  ? 1024
                  : 900,
      },
    );
    await navigate(page);
    await page.getByRole("link", { name: /Strength & Conditioning/ }).click();
    if (width < 1024)
      await page.getByRole("link", { name: t.edit, exact: true }).click();
    else {
      assert(
        page.url().includes("/classes?"),
        "Desktop class selection navigated",
      );
      await page.getByRole("button", { name: t.edit, exact: true }).click();
    }
    const date = page.getByLabel(t.date, { exact: true }),
      time = page.getByLabel(t.time, { exact: true });
    await date.waitFor();
    assert(
      (await date.isDisabled()) && (await time.isDisabled()),
      "Booked date/time unlocked",
    );
    await page.getByText(t.dateLocked, { exact: true }).waitFor();
    assert(
      await page
        .getByRole("button", { name: t.delete, exact: true })
        .isDisabled(),
      "Deletion allowed with attendance",
    );
    await page
      .getByLabel(t.description, { exact: true })
      .fill("Saved training notes.");
    await page
      .getByRole("button", { name: picker.changeWorkout, exact: true })
      .click();
    await page.getByRole("searchbox").fill("murph");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^Murph/ })
      .click();
    assert(
      (await page.getByLabel(t.variation, { exact: true }).inputValue()) === "",
      "Stale variation",
    );
    await page
      .getByLabel(t.variation, { exact: true })
      .selectOption("murph-rx");
    await checkLayout(page, width, `${width}-edit`);
    if (width === 375) {
      failure = 503;
      await page.getByRole("button", { name: t.save, exact: true }).click();
      await page.getByText(t.saveError, { exact: true }).waitFor();
      assert(
        (await page.getByLabel(t.description, { exact: true }).inputValue()) ===
          "Saved training notes.",
        "Failure lost notes",
      );
      assert(
        (await page.getByLabel(t.variation, { exact: true }).inputValue()) ===
          "murph-rx",
        "Failure lost variation",
      );
      failure = 0;
      writes = [];
    }
    if (width === 375) {
      gate = new Promise((resolve) => {
        release = resolve;
      });
    }
    await page.getByRole("button", { name: t.save, exact: true }).click();
    if (width === 375) {
      assert(
        await page
          .getByRole("button", { name: t.saving, exact: true })
          .isDisabled(),
        "Pending save remains enabled",
      );
      await page
        .locator("form")
        .last()
        .evaluate((form) => form.requestSubmit());
      release();
      gate = null;
    }
    await page.getByText(t.saved, { exact: true }).waitFor();
    assert(
      writes.length === 1 &&
        !("startsAt" in writes[0].body) &&
        writes[0].body.workoutId === "murph" &&
        writes[0].body.workoutVariantId === "murph-rx",
      "Invalid edit payload",
    );
    await page
      .getByRole("button", { name: picker.removeWorkout, exact: true })
      .click();
    assert(
      (await page.getByLabel(t.variation, { exact: true }).count()) === 0,
      "Variation remains after clearing",
    );
    await page.getByRole("button", { name: t.save, exact: true }).click();
    await page.getByText(t.saved, { exact: true }).waitFor();
    assert(
      writes[1].body.workoutId === null &&
        writes[1].body.workoutVariantId === null,
      "Clear not persisted",
    );
    await page.getByLabel(t.description, { exact: true }).fill("Unsaved draft");
    page.once("dialog", (dialog) => dialog.dismiss());
    if (width < 1024)
      await page.getByRole("link", { name: new RegExp(t.backDetails) }).click();
    else
      await page
        .getByRole("button", { name: t.backDetails, exact: true })
        .click();
    assert(
      (await page.getByLabel(t.description, { exact: true }).inputValue()) ===
        "Unsaved draft",
      "Discard guard lost draft",
    );
    await page
      .getByLabel(t.description, { exact: true })
      .fill("Saved training notes.");
    if (width < 1024) {
      await page.getByRole("link", { name: new RegExp(t.backDetails) }).click();
      await page.getByRole("link", { name: t.attendance, exact: true }).click();
    } else {
      await page
        .getByRole("button", { name: t.backDetails, exact: true })
        .click();
      await page
        .getByRole("button", { name: t.attendance, exact: true })
        .click();
    }
    const rosterSection = page.getByRole("region", {
      name: t.attendance,
      exact: true,
    });
    const count = rosterSection.getByRole("status");
    await rosterSection
      .getByRole("searchbox", { name: t.searchAthletes, exact: true })
      .waitFor();
    assert(
      (await count.innerText()).includes("1 of 3"),
      "Initial counter is not attended/booked",
    );
    await rosterSection.getByRole("searchbox").fill("Ana Torres");
    assert(
      (await rosterSection.locator("li").count()) === 1 &&
        (await count.innerText()).includes("1 of 3"),
      "Search changed attendance total",
    );
    gate = new Promise((resolve) => {
      release = resolve;
    });
    const ana = rosterSection.getByRole("button", {
      name: `${t.markAttended}: Ana Torres`,
      exact: true,
    });
    await ana.click();
    assert(await ana.isDisabled(), "Pending row not disabled");
    await rosterSection.getByRole("searchbox").fill("");
    assert(
      await rosterSection
        .getByRole("button", { name: `${t.undo}: Carlos Mendez`, exact: true })
        .isEnabled(),
      "Other rows disabled",
    );
    await rosterSection
      .getByRole("button", {
        name: `${t.markAttended}: Mariana Costa`,
        exact: true,
      })
      .click();
    assert(
      (await count.innerText()).includes("1 of 3"),
      "Attendance updated before persistence",
    );
    release();
    gate = null;
    await rosterSection
      .getByRole("button", { name: `${t.undo}: Ana Torres`, exact: true })
      .waitFor();
    await rosterSection
      .getByRole("button", { name: `${t.undo}: Mariana Costa`, exact: true })
      .waitFor();
    assert(
      (await count.innerText()).includes("3 of 3"),
      "Concurrent row updates lost",
    );
    await rosterSection
      .getByRole("button", { name: `${t.undo}: Ana Torres`, exact: true })
      .click();
    await rosterSection
      .getByRole("button", {
        name: `${t.markAttended}: Ana Torres`,
        exact: true,
      })
      .waitFor();
    assert((await count.innerText()).includes("2 of 3"), "Undo not persisted");
    failure = 503;
    await rosterSection
      .getByRole("button", { name: `${t.undo}: Mariana Costa`, exact: true })
      .click();
    await rosterSection.getByText(t.attendanceError, { exact: true }).waitFor();
    assert(
      (await count.innerText()).includes("2 of 3"),
      "Failure changed counter",
    );
    assert(
      await rosterSection
        .getByRole("button", { name: `${t.undo}: Mariana Costa`, exact: true })
        .isEnabled(),
      "Failure did not restore row action",
    );
    failure = 0;
    await rosterSection
      .getByRole("button", { name: `${t.undo}: Mariana Costa`, exact: true })
      .click();
    await rosterSection
      .getByRole("button", {
        name: `${t.markAttended}: Mariana Costa`,
        exact: true,
      })
      .waitFor();
    await rosterSection.getByRole("searchbox").fill("no-match");
    await rosterSection.getByText(t.noMatches, { exact: true }).waitFor();
    assert(
      (await count.innerText()).includes("1 of 3"),
      "Empty search changed total",
    );
    await rosterSection.getByRole("searchbox").fill("");
    await checkLayout(page, width, `${width}-attendance`);
    if (width === 375) {
      await navigate(page, "en", `/classes/visual-box/empty/edit?day=${day}`);
      await date.waitFor();
      assert(
        (await date.isEnabled()) && (await time.isEnabled()),
        "Unbooked date locked",
      );
      await page
        .getByLabel(t.description, { exact: true })
        .fill("Keep these notes");
      await date.fill("2020-01-01");
      await page.getByRole("button", { name: t.save, exact: true }).click();
      await page.getByText(t.futureError, { exact: true }).waitFor();
      const nextDay = new Date(`${day}T12:00:00Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      await date.fill(nextDay.toISOString().slice(0, 10));
      conflict = true;
      await page.getByRole("button", { name: t.save, exact: true }).click();
      await page.getByText(t.dateConflict, { exact: true }).waitFor();
      assert(await date.isDisabled(), "New booking did not lock dates");
      assert(
        (await page.getByLabel(t.description, { exact: true }).inputValue()) ===
          "Keep these notes",
        "Conflict lost draft",
      );
      await page.getByRole("button", { name: t.save, exact: true }).click();
      await page.getByText(t.saved, { exact: true }).waitFor();
      await page.getByRole("button", { name: t.delete, exact: true }).click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: t.delete, exact: true })
        .click();
      await page
        .getByRole("link", { name: /Strength & Conditioning/ })
        .waitFor();
      assert(
        !sessions.some((session) => session.id === "empty"),
        "Delete not persisted",
      );
    }
    await context.close();
    console.log(
      `PASS edit, attendance, search, concurrent persistence, failures and layout: ${width}`,
    );
  }
  for (const locale of ["es", "pt"]) {
    sessions = structuredClone(initial);
    const text = JSON.parse(
      await readFile(web + `/messages/${locale}.json`, "utf8"),
    ).classStaff;
    const { page, context } = await pageFor("coach", locale, {
      width: 390,
      height: 844,
    });
    await navigate(
      page,
      locale,
      `/classes/visual-box/strength/attendance?day=${day}`,
    );
    await page
      .getByRole("searchbox", { name: text.searchAthletes, exact: true })
      .waitFor();
    await page
      .getByRole("button", {
        name: `${text.markAttended}: Ana Torres`,
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: `${text.undo}: Ana Torres`, exact: true })
      .waitFor();
    await navigate(
      page,
      locale,
      `/classes/visual-box/strength/edit?day=${day}`,
    );
    await page.getByLabel(text.date, { exact: true }).waitFor();
    assert(
      await page.getByLabel(text.date, { exact: true }).isDisabled(),
      "Localized date lock missing",
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Localized overflow",
    );
    await context.close();
    console.log("PASS localization " + locale);
  }
  for (const mode of ["edit", "attendance"]) {
    const { page, context } = await pageFor("athlete", "en", {
      width: 390,
      height: 844,
    });
    await navigate(page, "en", `/classes/visual-box/strength/${mode}`);
    await page.getByText(t.forbidden, { exact: true }).waitFor();
    assert(
      (await page.getByText("Ana Torres", { exact: true }).count()) === 0,
      "Unauthorized roster exposed",
    );
    assert(
      (await page
        .getByRole("button", { name: new RegExp(t.markAttended) })
        .count()) === 0,
      "Unauthorized attendance actions",
    );
    await context.close();
  }
  failRead = true;
  const retry = await pageFor("coach", "en", { width: 1440, height: 900 });
  await navigate(retry.page, "en", `/classes/visual-box/strength/attendance`);
  await retry.page.getByText(t.loadError, { exact: true }).waitFor();
  failRead = false;
  await retry.page.getByRole("button", { name: t.retry, exact: true }).click();
  await retry.page
    .getByRole("searchbox", { name: t.searchAthletes, exact: true })
    .waitFor();
  await retry.context.close();
  assert(errors.length === 0, JSON.stringify(errors));
  console.log(
    "PASS authorization, recovery and all real Next.js Class Management & Attendance v3 checks",
  );
} finally {
  release?.();
  await browser?.close();
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {}
  api.close();
  logStream.end();
}
