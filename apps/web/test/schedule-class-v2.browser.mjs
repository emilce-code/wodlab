// Real Next.js critical-flow browser tests. Uses an ephemeral SDK-encrypted local test session
// and a local HTTP API/storage fixture. Never changes production auth code, never
// calls live Auth0/Supabase, and never stores real credentials in artifacts.
// Run: WODLY_PLAYWRIGHT_MODULE=<external package entry> node test/schedule-class-v2.browser.mjs
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
const phase = "schedule-v2";
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
const variants = [
  { id: "fran-rx", name: null, level: { key: "RX", name: "Rx" } },
  { id: "fran-scaled", name: null, level: { key: "SCALED", name: "Scaled" } },
];
const workouts = [
  { id: "fran", name: "Fran", variants },
  {
    id: "murph",
    name: "Murph",
    variants: [
      { id: "murph-rx", name: null, level: { key: "RX", name: "Rx" } },
    ],
  },
  { id: "open-gym", name: "Open Gym", variants: [] },
  ...Array.from({ length: 60 }, (_, i) => ({
    id: "workout-" + i,
    name: "Training session " + i,
    variants: [],
  })),
];
let writes = [],
  failure = 0,
  optionsFailure = false,
  optionsDelay = 0,
  optionsEmpty = false;
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
  if (url.pathname === "/boxes")
    return send(actor === "no-box" ? [] : [{ ...fixture, role }]);
  if (url.pathname === "/boxes/managed")
    return send(role !== "ATHLETE" ? [fixture] : []);
  if (url.pathname === "/boxes/visual-box/options") {
    if (optionsDelay)
      await new Promise((resolve) => setTimeout(resolve, optionsDelay));
    if (role === "ATHLETE" || optionsFailure) {
      res.statusCode = role === "ATHLETE" ? 403 : 503;
      return send({});
    }
    return send(optionsEmpty ? [] : workouts);
  }
  if (url.pathname === "/boxes/visual-box/classes") {
    if (req.method === "POST") {
      if (role === "ATHLETE") {
        res.statusCode = 403;
        return send({});
      }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      writes.push(body);
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (failure) {
        res.statusCode = failure;
        return send({ message: "fixture failure" });
      }
      res.statusCode = 201;
      return send({ id: "created-" + writes.length, ...body });
    }
    return send({ role, classes: [] });
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
  async function navigate(page, locale = "en", route = "/classes/schedule") {
    await page.goto(origin + "/" + locale + route, {
      waitUntil: "domcontentloaded",
    });
    await page.addStyleTag({
      content: "nextjs-portal{display:none !important}",
    });
  }
  const texts = async (locale = "en") =>
    JSON.parse(await readFile(web + `/messages/${locale}.json`, "utf8")).boxes
      .schedule;
  const t = await texts();
  async function inspect(page, width, label) {
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow: ${label}`,
    );
    const nav = page.locator("nav.fixed");
    assert((await nav.isVisible()) === width < 1024, `Navigation: ${label}`);
    if (width < 1024) {
      const action = await page.locator("[data-schedule-action]").boundingBox(),
        bar = await nav.boundingBox();
      assert(
        action && bar && action.y + action.height <= bar.y + 1,
        "Action overlaps navigation",
      );
      assert(
        (await nav
          .getByRole("button", { name: "Classes", exact: true })
          .getAttribute("aria-current")) === "page",
        "Classes is not active",
      );
      await page
        .getByLabel(t.description, { exact: true })
        .scrollIntoViewIfNeeded();
      const notes = await page
        .getByLabel(t.description, { exact: true })
        .boundingBox();
      assert(
        notes && notes.y + notes.height < action.y,
        "Notes obscured by action",
      );
    } else {
      assert(
        await page.locator("aside").first().isVisible(),
        "Desktop sidebar missing",
      );
      const date = await page.getByLabel(t.date, { exact: true }).boundingBox(),
        time = await page.getByLabel(t.time, { exact: true }).boundingBox();
      assert(
        Math.abs(date.y - time.y) < 2 && time.x > date.x,
        "Desktop field groups not in columns",
      );
    }
    if (process.env.WODLY_CAPTURE === "1") {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: path.join(root, label + ".png"),
        fullPage: true,
      });
    }
  }
  const widths = [375, 390, 430, 768, 1024, 1440].filter(
    (width) => !Number(process.argv[2]) || width === Number(process.argv[2]),
  );
  for (const width of widths) {
    writes = [];
    failure = 0;
    optionsFailure = false;
    optionsEmpty = false;
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
    await page.getByRole("heading", { name: t.title, exact: true }).waitFor();
    assert(
      (await page.getByLabel(t.duration, { exact: true }).inputValue()) ===
        "60",
      "Duration default changed",
    );
    assert(
      (await page.getByLabel(t.capacity, { exact: true }).inputValue()) ===
        "12",
      "Capacity default changed",
    );
    assert(
      (await page.getByLabel(t.time, { exact: true }).inputValue()) === "18:00",
      "Start default changed",
    );
    assert(
      (await page.getByLabel(t.variation, { exact: true }).count()) === 0,
      "Variation exposed before workout",
    );
    if (width === 375) {
      await page.getByRole("button", { name: t.create, exact: true }).click();
      await page.getByText(t.nameError, { exact: true }).waitFor();
      assert(writes.length === 0, "Invalid form submitted");
      await page.getByLabel(t.duration, { exact: true }).fill("14");
      await page.getByLabel(t.capacity, { exact: true }).fill("201");
      await page.getByLabel(t.date, { exact: true }).fill("2020-01-01");
      await page.getByRole("button", { name: t.create, exact: true }).click();
      await page.getByText(t.durationError, { exact: true }).waitFor();
      await page.getByText(t.capacityError, { exact: true }).waitFor();
      await page.getByText(t.futureError, { exact: true }).waitFor();
    }
    await page.getByLabel(t.name, { exact: true }).fill("Morning crew");
    await page.getByLabel(t.date, { exact: true }).fill("2099-10-10");
    await page.getByLabel(t.time, { exact: true }).fill("09:30");
    await page.getByLabel(t.duration, { exact: true }).fill("45");
    await page.getByLabel(t.capacity, { exact: true }).fill("16");
    await page
      .getByLabel(t.description, { exact: true })
      .fill("Bring your training shoes.");
    await inspect(page, width, `${width}-form`);
    if (width === 375) {
      await page.setViewportSize({ width, height: 500 });
      await page.getByLabel(t.description, { exact: true }).blur();
      await page.getByLabel(t.description, { exact: true }).focus();
      await inspect(page, width, "375-reduced-height");
      await page.setViewportSize({ width, height: 812 });
    }
    await page
      .getByRole("button", { name: t.chooseWorkout, exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: t.pickerTitle });
    await dialog.waitFor();
    await page.getByRole("searchbox", { name: t.searchWorkout }).waitFor();
    assert(
      await page
        .getByRole("searchbox")
        .evaluate((el) => el === document.activeElement),
      "Search not immediately focused",
    );
    await dialog.getByRole("button", { name: /^Fran/ }).waitFor();
    const bounds = await dialog.boundingBox();
    assert(
      bounds && bounds.height <= (await page.evaluate(() => innerHeight)) - 8,
      "Picker exceeds viewport",
    );
    if (width >= 1024) assert(bounds.x >= 256, "Picker covers sidebar");
    if (process.env.WODLY_CAPTURE === "1")
      await page.screenshot({ path: path.join(root, `${width}-picker.png`) });
    await page.getByRole("searchbox").fill("no-match");
    await dialog.getByText(t.noMatches, { exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert((await dialog.count()) === 0, "Escape did not close picker");
    assert(
      (await page.getByLabel(t.name, { exact: true }).inputValue()) ===
        "Morning crew",
      "Closing picker lost form values",
    );
    assert(
      await page
        .getByRole("button", { name: t.chooseWorkout, exact: true })
        .evaluate((el) => el === document.activeElement),
      "Focus not restored",
    );
    await page
      .getByRole("button", { name: t.chooseWorkout, exact: true })
      .click();
    await page.getByRole("searchbox").fill("fran");
    const fran = dialog.getByRole("button", { name: /^Fran/ });
    await fran.waitFor();
    if (width === 1024) {
      await fran.focus();
      await page.keyboard.press("Enter");
    } else await fran.click();
    await page.getByLabel(t.variation, { exact: true }).selectOption("fran-rx");
    await page
      .getByRole("button", { name: t.changeWorkout, exact: true })
      .click();
    await page.getByRole("searchbox").fill("murph");
    await dialog.getByRole("button", { name: /^Murph/ }).click();
    assert(
      (await page.getByLabel(t.variation, { exact: true }).inputValue()) === "",
      "Stale variation survived workout replacement",
    );
    await page
      .getByLabel(t.variation, { exact: true })
      .selectOption("murph-rx");
    await page
      .getByRole("button", { name: t.removeWorkout, exact: true })
      .click();
    assert(
      (await page.getByLabel(t.variation, { exact: true }).count()) === 0,
      "Clear left variation selector",
    );
    await page
      .getByRole("button", { name: t.chooseWorkout, exact: true })
      .click();
    await page.getByRole("searchbox").fill("Open Gym");
    await dialog.getByRole("button", { name: "Open Gym", exact: true }).click();
    assert(
      (await page.getByLabel(t.variation, { exact: true }).count()) === 0,
      "Variation exposed for workout without variants",
    );
    await page
      .getByRole("button", { name: t.changeWorkout, exact: true })
      .click();
    await page.getByRole("searchbox").fill("fran");
    await dialog.getByRole("button", { name: /^Fran/ }).click();
    await page
      .getByLabel(t.variation, { exact: true })
      .selectOption("fran-scaled");
    if (width === 375) {
      failure = 503;
      await page.getByRole("button", { name: t.create, exact: true }).click();
      await page.getByText(t.saveError, { exact: true }).waitFor();
      assert(
        (await page.getByLabel(t.name, { exact: true }).inputValue()) ===
          "Morning crew",
        "Failure lost class name",
      );
      assert(
        (await page.getByLabel(t.variation, { exact: true }).inputValue()) ===
          "fran-scaled",
        "Failure lost variation",
      );
      failure = 0;
      writes = [];
    }
    await page.getByRole("button", { name: t.create, exact: true }).click();
    assert(
      await page
        .getByRole("button", { name: t.creating, exact: true })
        .isDisabled(),
      "Submit not disabled",
    );
    assert(
      await page.getByLabel(t.name, { exact: true }).isDisabled(),
      "Pending form editable",
    );
    await page.locator("form").evaluate((form) => form.requestSubmit());
    await page
      .getByText(t.success.replace("{name}", "Morning crew"), { exact: true })
      .waitFor();
    assert(writes.length === 1, "Duplicate submission");
    assert(
      writes[0].name === "Morning crew" &&
        writes[0].startsAt === "2099-10-10T12:30:00.000Z" &&
        writes[0].durationMinutes === 45 &&
        writes[0].capacity === 16 &&
        writes[0].workoutId === "fran" &&
        writes[0].workoutVariantId === "fran-scaled" &&
        writes[0].description === "Bring your training shoes.",
      "Wrong scheduled payload or active box",
    );
    await page.getByLabel(t.name, { exact: true }).fill("Open training");
    await page.getByRole("button", { name: t.create, exact: true }).click();
    await page
      .getByText(t.success.replace("{name}", "Open training"), { exact: true })
      .waitFor();
    assert(
      !("workoutId" in writes[1]) &&
        !("workoutVariantId" in writes[1]) &&
        !("description" in writes[1]),
      "Optional fields became required or stale",
    );
    await context.close();
    console.log(
      `PASS schedule, picker, optional fields, duplicate guard and responsive layout: ${width}`,
    );
  }
  for (const locale of ["es", "pt"]) {
    const { page, context } = await pageFor("coach", locale, {
        width: 390,
        height: 844,
      }),
      text = await texts(locale);
    await navigate(page, locale);
    await page
      .getByRole("heading", { name: text.title, exact: true })
      .waitFor();
    await page.getByRole("button", { name: text.create, exact: true }).click();
    await page.getByText(text.nameError, { exact: true }).waitFor();
    await page
      .getByRole("button", { name: text.chooseWorkout, exact: true })
      .click();
    await page
      .getByRole("searchbox", { name: text.searchWorkout })
      .fill("fran");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^Fran/ })
      .click();
    await page
      .getByLabel(text.variation, { exact: true })
      .selectOption("fran-scaled");
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Localized overflow",
    );
    await context.close();
    console.log("PASS localization " + locale);
  }
  optionsFailure = true;
  const retry = await pageFor("coach", "en", { width: 390, height: 844 });
  await navigate(retry.page);
  await retry.page
    .getByRole("button", { name: t.chooseWorkout, exact: true })
    .click();
  await retry.page.getByText(t.workoutError, { exact: true }).waitFor();
  optionsFailure = false;
  optionsDelay = 300;
  await retry.page.getByRole("button", { name: t.retry, exact: true }).click();
  await retry.page.getByText(t.loadingWorkouts, { exact: true }).waitFor();
  await retry.page
    .getByRole("dialog")
    .getByRole("button", { name: /^Fran/ })
    .waitFor();
  optionsDelay = 0;
  await retry.context.close();
  optionsEmpty = true;
  const empty = await pageFor("owner", "en", { width: 1440, height: 900 });
  await navigate(empty.page);
  await empty.page
    .getByRole("button", { name: t.chooseWorkout, exact: true })
    .click();
  await empty.page.getByText(t.noWorkouts, { exact: true }).waitFor();
  await empty.context.close();
  optionsEmpty = false;
  for (const actor of ["athlete", "no-box"]) {
    const { page, context } = await pageFor(actor, "en", {
      width: 390,
      height: 844,
    });
    await navigate(page);
    await page
      .getByText(actor === "athlete" ? t.forbidden : t.noBox, { exact: true })
      .waitFor();
    assert(
      (await page.locator("form").count()) === 0,
      "Unauthorized scheduling form",
    );
    await context.close();
  }
  const entry = await pageFor("owner", "en", { width: 1440, height: 900 });
  await navigate(entry.page, "en", "/classes");
  await entry.page
    .getByRole("link", { name: "Schedule class", exact: true })
    .click();
  await entry.page
    .getByRole("heading", { name: t.title, exact: true })
    .waitFor();
  await entry.context.close();
  assert(errors.length === 0, JSON.stringify(errors));
  console.log(
    "PASS workout loading/empty/error/retry, authorization, staff entry and all Next.js Schedule Class v2 checks",
  );
} finally {
  await browser?.close();
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {}
  api.close();
  logStream.end();
}
