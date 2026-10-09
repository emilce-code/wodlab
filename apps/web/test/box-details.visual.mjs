// Real Next.js visual QA runner. Uses an ephemeral SDK-encrypted local test session
// and a local HTTP API/storage fixture. Never changes production auth code, never
// calls live Auth0/Supabase, and never stores real credentials in artifacts.
// Run on a checked-out revision: WODLY_PLAYWRIGHT_MODULE=<external package entry> node test/box-details.visual.mjs <evidence-name>
import http from "node:http";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
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
const phase = process.argv[2] || "after";
if (!/^[a-zA-Z0-9_-]+$/.test(phase))
  throw Error("Use a simple evidence directory name");
const root = path.resolve(
  web,
  "../../docs/design/box-details-v4/evidence",
  phase,
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
let box = { ...fixture },
  fail = false,
  delay = 0;
const api = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const actor = (req.headers.authorization || "")
    .replace("Bearer ", "")
    .split(":")[0];
  const locale = (req.headers.authorization || "").split(":")[1] || "en";
  const authorized = ["owner", "org-owner", "admin"].includes(actor);
  res.setHeader("Content-Type", "application/json");
  if (url.pathname.startsWith("/storage/")) {
    if (req.method === "GET") {
      res.setHeader("Content-Type", "image/svg+xml");
      return res.end(
        '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect x="1" y="1" width="78" height="78" rx="11" fill="#09090b" stroke="#a3ff12"/><text x="40" y="59" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="62" fill="#a3ff12">W</text></svg>',
      );
    }
    return res.end("{}");
  }
  if (url.pathname === "/me")
    return res.end(
      JSON.stringify({
        id: "visual-" + actor,
        email: actor + "@example.com",
        role: actor === "admin" ? "ADMIN" : "USER",
        permissions: authorized
          ? ["athlete:use", "box:manage"]
          : ["athlete:use"],
        preferredLocale: locale,
        athleteProfile: {
          id: "visual-profile",
          displayName: "Visual QA",
          leaderboardEnabled: false,
          preferredWeightUnit: "KG",
          avatarPath: null,
          bio: null,
          trainingGoals: [],
          weeklyTrainingTarget: null,
          preferredWorkoutLevel: null,
          preferredPrescriptionCategory: null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
  if (url.pathname === "/boxes")
    return res.end(
      JSON.stringify([
        {
          ...box,
          role:
            actor === "owner"
              ? "OWNER"
              : actor === "coach"
                ? "COACH"
                : "ATHLETE",
        },
      ]),
    );
  if (url.pathname === "/boxes/managed")
    return res.end(JSON.stringify(authorized ? [box] : []));
  if (url.pathname === "/boxes/active")
    return res.end(JSON.stringify({ id: box.id }));
  if (url.pathname === "/boxes/visual-box") {
    if (req.method === "PATCH") {
      if (!authorized) {
        res.statusCode = 403;
        return res.end('{"message":"Forbidden"}');
      }
      let data = "";
      for await (const chunk of req) data += chunk;
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      if (fail) {
        res.statusCode = 500;
        return res.end('{"message":"Test save failure"}');
      }
      box = { ...box, ...JSON.parse(data) };
    }
    return res.end(JSON.stringify({ ...box, canEditDetails: authorized }));
  }
  if (url.pathname.includes("notifications"))
    return res.end(JSON.stringify({ items: [], unreadCount: 0 }));
  res.statusCode = 404;
  res.end("{}");
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
      const r = await fetch(origin + "/manifest.webmanifest");
      if (r.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({
    executablePath: process.env.WODLY_CHROMIUM || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  const evidence = [];
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
    page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => errors.push(e.message));
    // Maps are intentionally blocked: directions must remain usable and no fake map is substituted.
    await page.route("https://www.google.com/**", (route) => route.abort());
    return { context, page };
  }
  async function capture(page, label, viewport) {
    await page.addStyleTag({ content: "nextjs-portal{display:none !important}" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    });
    await page.screenshot({
      path: `${root}/${viewport.width}x${viewport.height}-${label}.png`,
      fullPage: label === "owner",
    });
    evidence.push(`${viewport.width}x${viewport.height}-${label}.png`);
  }
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
  ]) {
    box = { ...fixture };
    const { page, context } = await pageFor("athlete", "en", viewport);
    await page.goto(origin + "/en/boxes/visual-box");
    await page.addStyleTag({
      content: "nextjs-portal{display:none !important}",
    });
    await page
      .getByRole("heading", { name: fixture.name, exact: true })
      .waitFor();
    const t = JSON.parse(
      await readFile(web + "/messages/en.json", "utf8"),
    ).boxDetailsV4;
    await page.getByText(t.mapUnavailable, { exact: true }).waitFor();
    await capture(page, "athlete", viewport);
    await page.getByRole("button", { name: t.contactOptions }).click();
    await page.locator("dialog[open]").waitFor();
    await capture(page, "contacts", viewport);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: t.directions }).click();
    await page.locator("dialog[open]").waitFor();
    await capture(page, "directions", viewport);
    await page.keyboard.press("Escape");
    await context.close();
    const owner = await pageFor("owner", "en", viewport);
    const editor = owner.page;
    await editor.goto(origin + "/en/boxes/visual-box/edit");
    await editor.addStyleTag({
      content: "nextjs-portal{display:none !important}",
    });
    await editor.locator("#box-name").waitFor();
    await editor.getByText(t.mapUnavailable, { exact: true }).waitFor();
    await capture(editor, "owner", viewport);
    await editor.locator("#box-name").fill("");
    await editor.getByRole("button", { name: t.save, exact: true }).click();
    await editor.getByText(t.invalidName, { exact: true }).waitFor();
    await capture(editor, "validation", viewport);
    await editor.locator("#box-name").fill("CrossFit Central Updated");
    delay = 1800;
    await editor.getByRole("button", { name: t.save, exact: true }).click();
    await editor
      .getByRole("button", { name: t.working, exact: true })
      .waitFor();
    await capture(editor, "saving", viewport);
    await editor.getByText(t.saved, { exact: true }).waitFor();
    delay = 0;
    await capture(editor, "success", viewport);
    await editor.locator("#box-website").focus();
    await editor.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await capture(editor, "owner-bottom", viewport);
    const saveRect = await editor
      .getByRole("button", { name: t.save, exact: true })
      .boundingBox();
    if (
      !saveRect ||
      saveRect.y < 0 ||
      saveRect.y + saveRect.height > viewport.height
    )
      throw Error("Sticky Save not visible");
    await owner.context.close();
    console.log(`Captured ${phase} ${viewport.width}x${viewport.height}`);
  }

  // Additional functional checks use the same real Next.js routing and SDK boundary.
  for (const locale of ["en", "es", "pt"]) {
    box = { ...fixture };
    const t = JSON.parse(
      await readFile(web + `/messages/${locale}.json`, "utf8"),
    ).boxDetailsV4;
    const { page, context } = await pageFor("athlete", locale, {
      width: 375,
      height: 812,
    });
    await page.goto(origin + `/${locale}/boxes/visual-box`);
    await page
      .getByRole("heading", { name: fixture.name, exact: true })
      .waitFor();
    if (
      !(await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ))
    )
      throw Error(`Horizontal overflow: ${locale}`);
    await page.getByRole("button", { name: t.contactOptions }).click();
    await page.locator("dialog[open]").waitFor();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      if (
        !(await page.evaluate(() =>
          Boolean(document.activeElement.closest("dialog")),
        ))
      )
        throw Error("Sheet focus escaped");
    }
    await page.keyboard.press("Escape");
    if (
      !(await page
        .getByRole("button", { name: t.contactOptions })
        .evaluate((el) => el === document.activeElement))
    )
      throw Error("Sheet focus not restored");
    await page.getByRole("button", { name: t.directions }).click();
    await page
      .getByRole("button", { name: t.dismissMaps, exact: true })
      .click();
    await context.close();
    const owner = await pageFor("owner", locale, { width: 375, height: 812 });
    await owner.page.goto(origin + `/${locale}/boxes/visual-box/edit`);
    await owner.page.locator("#box-name").waitFor();
    await owner.page.locator("#box-name").fill("Edited name");
    fail = true;
    await owner.page.getByRole("button", { name: t.save, exact: true }).click();
    await owner.page.getByText(t.saveError, { exact: true }).waitFor();
    await capture(owner.page, `save-error-${locale}`, {
      width: 375,
      height: 812,
    });
    if ((await owner.page.locator("#box-name").inputValue()) !== "Edited name")
      throw Error("Failed save discarded values");
    owner.page.once("dialog", (dialog) => dialog.dismiss());
    await owner.page
      .getByRole("button", { name: t.cancel, exact: true })
      .click();
    if (!owner.page.url().endsWith("/edit"))
      throw Error("Unsaved navigation was not canceled");
    fail = false;
    await owner.page.getByRole("button", { name: t.save, exact: true }).click();
    await owner.page.getByText(t.saved, { exact: true }).waitFor();
    if (
      !(await owner.page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ))
    )
      throw Error(`Editor overflow: ${locale}`);
    await owner.context.close();
    console.log(
      `PASS actual Next.js ${locale}: sheets, dismissal/focus, failed save, unsaved guard, responsive editor`,
    );
  }
  for (const actor of ["admin", "org-owner", "owner", "coach", "athlete"]) {
    box = { ...fixture };
    const { page, context } = await pageFor(actor, "en", {
      width: 390,
      height: 844,
    });
    await page.goto(origin + "/en/boxes/visual-box");
    await page
      .getByRole("heading", { name: fixture.name, exact: true })
      .waitFor();
    const t = JSON.parse(
      await readFile(web + "/messages/en.json", "utf8"),
    ).boxDetailsV4;
    const authorized = ["admin", "org-owner", "owner"].includes(actor);
    if (
      Boolean(
        await page.getByRole("link", { name: t.edit, exact: true }).count(),
      ) !== authorized
    )
      throw Error(`Incorrect edit action: ${actor}`);
    await page.goto(origin + "/en/boxes/visual-box/edit");
    if (authorized) await page.locator("#box-name").waitFor();
    else {
      await page.waitForURL(origin + "/en/boxes/visual-box");
    }
    await context.close();
    console.log(`PASS actual Next.js scoped editor UI: ${actor}`);
  }
  await writeFile(
    root + "/manifest.json",
    JSON.stringify(
      {
        phase,
        fixture:
          "Local API and SDK-encrypted synthetic session; real Next.js app, middleware, layout, routing, translations and CSS. External Auth0 and Supabase not called; Google map intentionally blocked.",
        evidence,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  if (errors.length) throw Error(JSON.stringify(errors));
  console.log(`${evidence.length} actual Next.js screenshots saved.`);
} finally {
  await browser?.close();
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {}
  api.close();
  logStream.end();
}
