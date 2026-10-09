// Real Next.js critical-flow browser tests. Uses an ephemeral SDK-encrypted local test session
// and a local HTTP API/storage fixture. Never changes production auth code, never
// calls live Auth0/Supabase, and never stores real credentials in artifacts.
// Run: WODLY_PLAYWRIGHT_MODULE=<external package entry> node test/classes-v7.browser.mjs
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
const phase = "classes-v7";
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
const initial = [
  sample("strength", "Strength & Conditioning", "18", {
    description: "Build strength and move well.",
    workout: {
      id: "workout-1",
      name: "Fran",
      description: "21–15–9 thrusters and pull-ups.",
      type: { key: "FOR_TIME", name: "For Time" },
    },
    workoutVariant: { level: { key: "RX", name: "Rx" } },
  }),
  sample("full", "Full Class", "19", { bookedCount: 10 }),
  sample("booked", "Reserved Class", "20", {
    currentUserBooking: { id: "booking-1", status: "BOOKED" },
  }),
  sample("attended", "Attended Class", "21", {
    currentUserBooking: { id: "booking-2", status: "ATTENDED" },
  }),
];
let sessions = structuredClone(initial),
  mutations = 0,
  failure = 0,
  delay = 0,
  failRead = false;
const api = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const token = (req.headers.authorization || "")
    .replace("Bearer ", "")
    .split(":");
  const actor = token[0],
    locale = token[1] || "en";
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
  if (url.pathname === "/boxes/visual-box/options")
    return send({ workouts: [] });
  if (url.pathname === "/boxes/active") return send({ id: fixture.id });
  if (url.pathname === "/boxes/managed")
    return send(role !== "ATHLETE" ? [fixture] : []);
  if (url.pathname === "/boxes/visual-box") return send({ ...fixture, role });
  if (url.pathname === "/boxes/visual-box/classes") {
    if (failRead) {
      res.statusCode = 503;
      return send({});
    }
    return send({ role, classes: sessions });
  }
  const match = url.pathname.match(
    /^\/boxes\/visual-box\/classes\/([^/]+)(\/book)?$/,
  );
  if (match) {
    const session = sessions.find((s) => s.id === match[1]);
    if (!session) {
      res.statusCode = 404;
      return send({});
    }
    if (match[2]) {
      mutations++;
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      if (failure) {
        res.statusCode = failure;
        if (failure === 409) session.bookedCount = session.capacity;
        return send({ message: "fixture failure" });
      }
      if (req.method === "POST") {
        session.bookedCount++;
        session.currentUserBooking = { id: "new-booking", status: "BOOKED" };
      }
      if (req.method === "DELETE") {
        session.bookedCount--;
        session.currentUserBooking = null;
      }
      return send(
        session.currentUserBooking || {
          id: "new-booking",
          status: "CANCELLED",
        },
      );
    }
    if (failRead) {
      res.statusCode = 503;
      return send({});
    }
    return send({ ...session, role });
  }
  if (url.pathname.includes("notifications"))
    return send({ items: [], unreadCount: 0 });
  if (url.pathname.includes("workouts")) return send([]);
  if (url.pathname.startsWith("/storage/")) {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.end('<svg xmlns="http://www.w3.org/2000/svg"/>');
  }
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
  async function layout(page, width, label) {
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow ${label}`,
    );
    const bottom = page.locator("nav.fixed");
    assert(
      (await bottom.isVisible()) === width < 1024,
      `Mobile navigation ${label}`,
    );
    if (width < 1024) {
      assert(
        (await bottom
          .locator('button[aria-controls="mobile-more-menu"]')
          .getAttribute("aria-current")) === "page",
        "Classes nav not selected",
      );
      const action = page.locator("[data-class-action]");
      if (await action.count()) {
        const a = await action.boundingBox(),
          n = await bottom.boundingBox();
        assert(a.y + a.height <= n.y + 1, "Booking action overlaps navigation");
      }
    }
    if (process.env.WODLY_CAPTURE)
      await page.screenshot({
        path: root + "/" + label + ".png",
        fullPage: false,
      });
  }
  for (const width of [375, 390, 430, 768, 1024, 1440]) {
    sessions = structuredClone(initial);
    mutations = 0;
    failure = 0;
    const { page, context } = await pageFor("athlete", "en", {
      width,
      height: { 375: 812, 390: 844, 430: 932, 768: 1024, 1024: 800, 1440: 900 }[
        width
      ],
    });
    const t = JSON.parse(
      await readFile(web + "/messages/en.json", "utf8"),
    ).classesV7;
    await navigate(page);
    const row = page.getByRole("link", { name: /Strength & Conditioning/ });
    await row.waitFor();
    assert(
      (await page.locator("li button").count()) === 0,
      "Row contains a booking button",
    );
    assert(
      (await page.locator("li h3").allTextContents()).join("|") ===
        initial.map((s) => s.name).join("|"),
      "Rows are not chronological",
    );
    if (width >= 1024)
      await page.getByText(t.selectClass, { exact: true }).waitFor();
    await layout(page, width, `${width}-initial-schedule`);
    const scheduleUrl = page.url();
    if (width === 1024) {
      await row.focus();
      await page.keyboard.press("Enter");
    } else await row.click();
    if (width < 1024) await page.waitForURL("**/classes/visual-box/strength?*");
    await page
      .getByRole("heading", { name: initial[0].name, exact: true, level: 1 })
      .waitFor();
    if (width >= 1024)
      assert(page.url() === scheduleUrl, "Desktop navigated away");
    else
      assert(
        page.url().includes("/classes/visual-box/strength"),
        "Mobile detail route missing",
      );
    await page.getByRole("link", { name: new RegExp(t.viewWorkout) }).waitFor();
    assert(
      (await page
        .locator('a[href*="/workouts/workout-1?variation=RX"]')
        .count()) === 1,
      "Existing workout link missing",
    );
    await layout(page, width, `${width}-details`);
    delay = 700;
    await page.getByRole("button", { name: t.book, exact: true }).click();
    const working = page.getByRole("button", { name: t.working, exact: true });
    await working.waitFor();
    assert(await working.isDisabled(), "Pending request not disabled");
    await page.getByRole("button", { name: t.cancel, exact: true }).waitFor();
    assert(mutations === 1, "Duplicate booking");
    delay = 0;
    await page.getByText(t.reserved, { exact: true }).waitFor();
    failure = 500;
    await page.getByRole("button", { name: t.cancel, exact: true }).click();
    await page.getByText(t.actionError, { exact: true }).waitFor();
    assert(
      await page
        .getByRole("button", { name: t.cancel, exact: true })
        .isEnabled(),
      "Failed cancellation discarded booking",
    );
    failure = 0;
    await page.getByRole("button", { name: t.cancel, exact: true }).click();
    await page.getByRole("button", { name: t.book, exact: true }).waitFor();
    assert(mutations === 3, "Cancellation missing");
    failure = 500;
    await page.getByRole("button", { name: t.book, exact: true }).click();
    await page.getByText(t.actionError, { exact: true }).waitFor();
    assert(
      await page.getByRole("button", { name: t.book, exact: true }).isEnabled(),
      "Failed booking changed state",
    );
    failure = 409;
    await page.getByRole("button", { name: t.book, exact: true }).click();
    await page.getByText(t.stale, { exact: true }).waitFor();
    await page.getByRole("button", { name: t.full, exact: true }).waitFor();
    assert(
      await page
        .getByRole("button", { name: t.full, exact: true })
        .isDisabled(),
      "Stale full class bookable",
    );
    failure = 0;
    if (width < 1024) {
      await page.getByRole("link", { name: new RegExp(t.back) }).click();
      await row.waitFor();
    }
    await page.getByRole("link", { name: /Full Class/ }).click();
    await page.getByText(t.noWorkout, { exact: true }).waitFor();
    assert(
      await page
        .getByRole("button", { name: t.full, exact: true })
        .isDisabled(),
      "Full class bookable",
    );
    if (width < 1024) {
      await page.getByRole("link", { name: new RegExp(t.back) }).click();
      await row.waitFor();
    }
    await page.getByRole("link", { name: /Attended Class/ }).click();
    await page.getByRole("button", { name: t.attended, exact: true }).waitFor();
    assert(
      await page
        .getByRole("button", { name: t.attended, exact: true })
        .isDisabled(),
      "Attendance cancellable",
    );
    if (width < 1024) {
      await page.getByRole("link", { name: new RegExp(t.back) }).click();
      await row.waitFor();
    }
    await page.getByRole("button", { name: t.mine, exact: true }).click();
    assert((await row.count()) === 0, "My Bookings shows unbooked class");
    await page.getByRole("link", { name: /Reserved Class/ }).click();
    await page.getByRole("button", { name: t.cancel, exact: true }).click();
    if (width < 1024) {
      await page.getByRole("button", { name: t.book, exact: true }).waitFor();
      await page.getByRole("link", { name: new RegExp(t.back) }).click();
      await page.getByRole("button", { name: t.mine, exact: true }).waitFor();
      assert(
        (await page
          .getByRole("button", { name: t.mine, exact: true })
          .getAttribute("aria-pressed")) === "true",
        "Back lost filter",
      );
    } else await page.getByText(t.selectClass, { exact: true }).waitFor();
    assert(
      (await page.getByRole("link", { name: /Reserved Class/ }).count()) === 0,
      "Canceled class still in My Bookings",
    );
    const emptyDay = new Date(`${day}T12:00:00Z`);
    emptyDay.setUTCDate(emptyDay.getUTCDate() + 1);
    await page
      .getByRole("button", {
        name: new Intl.DateTimeFormat("en", {
          weekday: "long",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }).format(emptyDay),
        exact: true,
      })
      .click();
    await page.getByText(t.emptyMine, { exact: true }).waitFor();
    await page.getByRole("button", { name: t.all, exact: true }).click();
    await page.getByText(t.empty, { exact: true }).waitFor();
    await layout(page, width, `${width}-schedule`);
    await context.close();
    console.log(
      "PASS responsive selection, booking/cancel/errors/filter/nav: " + width,
    );
  }
  for (const locale of ["es", "pt"]) {
    sessions = structuredClone(initial);
    const { page, context } = await pageFor("athlete", locale, {
      width: 390,
      height: 844,
    });
    const t = JSON.parse(
      await readFile(web + `/messages/${locale}.json`, "utf8"),
    ).classesV7;
    await navigate(page, locale);
    await page.getByRole("link", { name: /Strength & Conditioning/ }).click();
    await page.getByRole("button", { name: t.book, exact: true }).waitFor();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Localized overflow",
    );
    await context.close();
    console.log("PASS localization " + locale);
  }
  sessions = structuredClone(initial);
  failRead = true;
  const retry = await pageFor("athlete", "en", { width: 390, height: 844 }),
    t = JSON.parse(await readFile(web + "/messages/en.json", "utf8")).classesV7;
  await navigate(retry.page);
  await retry.page.getByText(t.loadError, { exact: true }).waitFor();
  failRead = false;
  await retry.page.getByRole("button", { name: t.retry, exact: true }).click();
  await retry.page
    .getByRole("link", { name: /Strength & Conditioning/ })
    .waitFor();
  await retry.context.close();
  for (const actor of ["owner", "coach"]) {
    const { page, context } = await pageFor(actor, "en", {
      width: 1440,
      height: 900,
    });
    await navigate(page);
    await page
      .getByRole("heading", { name: "Boxes and classes", exact: true })
      .waitFor();
    const staffT = JSON.parse(
      await readFile(web + "/messages/en.json", "utf8"),
    ).boxes;
    await page
      .getByRole("button", { name: staffT.classForm.open, exact: true })
      .click();
    await page.locator("form").waitFor();
    assert(
      (await page
        .getByRole("button", { name: t.book, exact: true })
        .count()) === 0,
      "Athlete actions rendered in staff schedule",
    );
    await context.close();
    console.log("PASS staff functionality retained: " + actor);
  }
  assert(errors.length === 0, JSON.stringify(errors));
  console.log("PASS all actual Next.js Classes v7 browser checks");
} finally {
  await browser?.close();
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {}
  api.close();
  logStream.end();
}
