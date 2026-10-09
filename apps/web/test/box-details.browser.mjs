// Component browser acceptance tests. Run after the Next.js compile emits CSS.
// Requires playwright-core installed outside the checkout; set WODLY_PLAYWRIGHT_MODULE to its entry point.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, readFile, readdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiRequire = createRequire(
  await realpath(path.join(web, "../api/node_modules/tsx/package.json")),
);
const esbuild = apiRequire("esbuild");
const { chromium } = await import(
  process.env.WODLY_PLAYWRIGHT_MODULE || "playwright-core"
);
const scratch = await mkdtemp(path.join(tmpdir(), "wodly-box-details-"));
const messages = Object.fromEntries(
  await Promise.all(
    ["en", "es", "pt"].map(async (locale) => [
      locale,
      JSON.parse(
        await readFile(path.join(web, `messages/${locale}.json`), "utf8"),
      ),
    ]),
  ),
);
const mocks = {
  "next-intl": `export function useTranslations(namespace) { return (key, params = {}) => { let value = namespace.split('.').reduce((v,k) => v[k], window.__messages); for (const k of key.split('.')) value = value[k]; if (typeof value !== 'string') throw Error('Missing translation: '+namespace+'.'+key); return value.replace(/\\{(\\w+)\\}/g, (_,k) => params[k] ?? '{'+k+'}'); }; }`,
  "next/image": `import React from 'react'; export default function Image({fill,sizes,unoptimized,...props}) {return <img {...props} style={{width:'100%',height:'100%',objectFit:'cover'}}/>;}`,
  "@/i18n/navigation": `import React from 'react'; export function Link(props) {return <a {...props}/>;} export function useRouter() {return {push: url => {window.__navigation = url;},refresh: () => {}};}`,
  "@/components/layout/ActiveBoxContext": `export function useActiveBox() {return {boxes:[window.__box],saving:false,selectBox: async id => {window.__selectedBox = id; return true;},replaceBoxes: () => {}};}`,
};
await esbuild.build({
  stdin: {
    contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import View from ${JSON.stringify(path.join(web, "app/[locale]/(app)/boxes/[boxId]/components/BoxDetailsView.tsx"))}; import Editor from ${JSON.stringify(path.join(web, "app/[locale]/(app)/boxes/[boxId]/edit/BoxDetailsEditor.tsx"))}; createRoot(document.getElementById('root')).render(location.pathname === '/edit' ? <Editor initialBox={window.__box}/> : <View box={window.__box}/>);`,
    resolveDir: web,
    loader: "tsx",
  },
  bundle: true,
  outfile: path.join(scratch, "bundle.js"),
  jsx: "automatic",
  tsconfig: path.join(web, "tsconfig.json"),
  define: {
    "process.env.NODE_ENV": '"test"',
    "process.env.NEXT_PUBLIC_SUPABASE_URL": '"https://storage.example"',
  },
  plugins: [
    {
      name: "boundary-mocks",
      setup(build) {
        build.onResolve(
          {
            filter:
              /^(next-intl|next\/image|@\/i18n\/navigation|@\/components\/layout\/ActiveBoxContext)$/,
          },
          (args) => ({ path: args.path, namespace: "mock" }),
        );
        build.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
          contents: mocks[args.path],
          loader: "tsx",
          resolveDir: web,
        }));
      },
    },
  ],
});
const cssFiles = (await readdir(path.join(web, ".next/static/chunks"))).filter(
  (f) => f.endsWith(".css"),
);
assert.ok(cssFiles.length, "Run the Next.js compile before browser checks");
const css = (
  await Promise.all(
    cssFiles.map((f) =>
      readFile(path.join(web, ".next/static/chunks", f), "utf8"),
    ),
  )
).join("\n");
const js = await readFile(path.join(scratch, "bundle.js"));
const server = http.createServer((request, response) => {
  response.setHeader(
    "Content-Type",
    request.url === "/bundle.js"
      ? "text/javascript"
      : request.url === "/style.css"
        ? "text/css"
        : "text/html",
  );
  response.end(
    request.url === "/bundle.js"
      ? js
      : request.url === "/style.css"
        ? css
        : '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><main id="root" class="mx-auto max-w-xl p-4"></main><script src="/bundle.js"></script></body></html>',
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.WODLY_CHROMIUM || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const fixture = {
  id: "box-1",
  name: "North Box",
  description: "Train together",
  organization: { id: "org-1", name: "WODLY Boxes" },
  location: "Asunción",
  address: "Main street 123",
  latitude: 0,
  longitude: 0,
  timezone: "UTC",
  logoPath: null,
  coverImagePath: "legacy-banner.webp",
  supportContact: "Ask for Ana",
  whatsapp: "+595981123456",
  phone: "+5511987654321",
  email: "hello@example.com",
  instagram: "@box",
  website: "https://example.com",
  canEditDetails: false,
};
let passed = 0;
const report = (label) => {
  console.log(`PASS ${label}`);
  passed++;
};
async function pageFor(locale, box = fixture, view = "/", width = 320) {
  const page = await browser.newPage({ viewport: { width, height: 720 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(
    ({ box, messages }) => {
      window.__box = box;
      window.__messages = messages;
    },
    { box, messages: messages[locale] },
  );
  await page.route("https://www.google.com/**", (route) => route.abort());
  await page.route("https://storage.example/**", (route) => route.abort());
  await page.goto(origin + view);
  await page
    .getByRole("heading", {
      name: view === "/edit" ? messages[locale].boxDetailsV4.edit : box.name,
      exact: true,
    })
    .waitFor();
  return { page, errors, t: messages[locale].boxDetailsV4 };
}
try {
  for (const locale of ["en", "es", "pt"]) {
    const { page, errors, t } = await pageFor(locale);
    assert.equal(
      await page.getByRole("link", { name: "WhatsApp", exact: true }).count(),
      1,
    );
    assert.equal(
      await page
        .getByRole("link", { name: t.channels.phone, exact: true })
        .count(),
      1,
    );
    assert.equal(
      await page.getByRole("link", { name: t.edit, exact: true }).count(),
      0,
    );
    assert.equal(await page.locator("img").count(), 0, "No banner rendered");
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "No horizontal overflow",
    );
    await page.getByRole("button", { name: t.contactOptions }).click();
    assert.equal(await page.locator("dialog a").count(), 5);
    assert.equal(
      await page.locator("dialog").getByText("Ask for Ana").count(),
      1,
    );
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      assert.ok(
        await page.evaluate(() =>
          Boolean(document.activeElement.closest("dialog")),
        ),
      );
    }
    await page.keyboard.press("Escape");
    assert.ok(
      await page
        .getByRole("button", { name: t.contactOptions })
        .evaluate((e) => e === document.activeElement),
    );
    await page.getByRole("button", { name: t.directions }).click();
    assert.match(
      await page
        .getByRole("link", { name: "Google Maps" })
        .getAttribute("href"),
      /destination=0%2C0/,
    );
    assert.match(
      await page.getByRole("link", { name: "Apple Maps" }).getAttribute("href"),
      /daddr=0%2C0/,
    );
    assert.equal(
      await page.evaluate(() => window.__selectedBox),
      undefined,
      "Maps chooser preserves active box",
    );
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: t.classes, exact: true }).click();
    assert.equal(await page.evaluate(() => window.__selectedBox), "box-1");
    assert.equal(await page.evaluate(() => window.__navigation), "/classes");
    assert.deepEqual(errors, []);
    await page.close();
    report(
      `${locale}: mobile contacts, keyboard modal, directions despite map failure, classes`,
    );
  }
  {
    const empty = {
      ...fixture,
      description: null,
      organization: null,
      location: null,
      address: null,
      latitude: null,
      longitude: null,
      supportContact: null,
      whatsapp: null,
      phone: null,
      email: null,
      instagram: null,
      website: null,
    };
    const { page, t } = await pageFor("en", empty);
    assert.equal(
      await page.getByRole("button", { name: t.contactOptions }).count(),
      0,
    );
    assert.equal(
      await page.getByRole("button", { name: t.directions }).count(),
      0,
    );
    assert.equal(await page.locator("iframe").count(), 0);
    await page.close();
    report("Missing optional sections disappear");
    const { page: addressPage, t: addressT } = await pageFor("en", {
      ...empty,
      address: "Main & First",
      canEditDetails: true,
      logoPath: "missing.webp",
    });
    assert.equal(await addressPage.locator("iframe").count(), 0);
    await addressPage.getByRole("link", { name: addressT.edit }).waitFor();
    await addressPage
      .getByRole("button", { name: addressT.directions })
      .click();
    assert.match(
      await addressPage
        .getByRole("link", { name: "Google Maps" })
        .getAttribute("href"),
      /Main%20%26%20First/,
    );
    await addressPage.keyboard.press("Escape");
    await addressPage.getByText("N", { exact: true }).waitFor();
    await addressPage.close();
    report("Address fallback, owner edit link, failed logo fallback");
  }
  for (const count of [1, 2]) {
    const channels = {
      whatsapp: "+595981123456",
      phone: count === 2 ? "+5511987654321" : null,
      email: null,
      instagram: null,
      website: null,
      supportContact: null,
    };
    const { page, t } = await pageFor("en", { ...fixture, ...channels });
    assert.equal(
      await page.getByRole("button", { name: t.contactOptions }).count(),
      0,
    );
    assert.equal(
      await page.locator('section[aria-label="Contact"] a').count(),
      count,
    );
    await page.close();
    report(`${count} contact methods: no redundant options sheet`);
  }
  for (const locale of ["en", "es", "pt"]) {
    const { page, errors, t } = await pageFor(
      locale,
      { ...fixture, canEditDetails: true },
      "/edit",
    );
    let attempts = 0,
      fail = true,
      requests = [];
    await page.route("**/api/boxes/box-1", async (route) => {
      attempts++;
      const body = route.request().postDataJSON();
      requests.push(body);
      await route.fulfill({
        status: fail ? 500 : 200,
        contentType: "application/json",
        body: JSON.stringify(
          fail ? { message: "Failed" } : { ...fixture, ...body },
        ),
      });
    });
    await page.locator("#box-name").fill("");
    await page.getByRole("button", { name: t.save, exact: true }).click();
    await page.getByText(t.invalidName, { exact: true }).waitFor();
    assert.equal(attempts, 0);
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "box-name",
    );
    await page.locator("#box-name").fill("Updated Box");
    await page.locator("#box-latitude").fill("91");
    await page.getByRole("button", { name: t.save, exact: true }).click();
    await page.getByText(t.invalidCoordinates, { exact: true }).waitFor();
    await page.locator("#box-latitude").fill("");
    await page.locator("#box-longitude").fill("");
    await page.locator("#box-description").fill("");
    await page.locator("#box-address").fill("");
    await page.getByRole("button", { name: t.save, exact: true }).click();
    await page
      .getByRole("alert")
      .getByText(t.saveError, { exact: true })
      .waitFor();
    assert.equal(await page.locator("#box-name").inputValue(), "Updated Box");
    let warned = false;
    page.once("dialog", async (dialog) => {
      warned = true;
      await dialog.dismiss();
    });
    await page.getByRole("button", { name: t.cancel, exact: true }).click();
    assert.equal(warned, true);
    assert.equal(await page.evaluate(() => window.__navigation), undefined);
    fail = false;
    const beforeSave = attempts;
    await page.evaluate(() => {
      const form = document.querySelector("form");
      form.requestSubmit();
      form.requestSubmit();
    });
    await page
      .getByRole("status")
      .getByText(t.saved, { exact: true })
      .waitFor();
    assert.equal(
      attempts,
      beforeSave + 1,
      "Duplicate save submission prevented",
    );
    assert.equal(requests.at(-1).latitude, null);
    assert.equal(requests.at(-1).description, "");
    assert.ok(!("organizationId" in requests.at(-1)));
    assert.ok(
      await page
        .getByRole("button", { name: t.save, exact: true })
        .isDisabled(),
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.equal(await page.locator("input[required]").count(), 1);
    assert.deepEqual(errors, []);
    await page.close();
    report(
      `${locale}: editor validation, failure preserves values, unsaved warning, optional fields, successful save`,
    );
  }
  {
    const { page, t } = await pageFor(
      "en",
      { ...fixture, canEditDetails: true },
      "/edit",
      375,
    );
    let uploads = 0,
      removed = false;
    await page.route("**/api/boxes/box-1/image", async (route) => {
      if (route.request().method() === "DELETE") removed = true;
      else uploads++;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          path: removed ? null : "boxes/box-1/logo.webp",
        }),
      });
    });
    await page.locator("#box-logo").setInputFiles({
      name: "broken.png",
      mimeType: "image/png",
      buffer: Buffer.from("invalid image"),
    });
    await page.getByText(t.logoError, { exact: true }).waitFor();
    assert.equal(uploads, 0, "Malformed image never uploaded");
    const png = Buffer.from(
      await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#a3ff12";
        ctx.fillRect(0, 0, 32, 32);
        return canvas.toDataURL("image/png").split(",")[1];
      }),
      "base64",
    );
    await page
      .locator("#box-logo")
      .setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
    await page.getByText(t.logoSaved, { exact: true }).waitFor();
    assert.equal(uploads, 1);
    await page.getByRole("button", { name: t.removeLogo }).click();
    await page.getByText(t.logoSaved, { exact: true }).waitFor();
    assert.equal(removed, true);
    await page.close();
    report("Logo optimization/upload and removal");
  }
  console.log(
    `${passed} browser scenarios passed (mocked auth, API, and storage boundaries).`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await rm(scratch, { recursive: true, force: true });
}
