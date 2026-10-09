// Internal component acceptance checks; no screenshot or visual artifacts.
// Run after Next.js compilation: WODLY_PLAYWRIGHT_MODULE=<external entry> node test/design-system.browser.mjs
// Families not yet merged during incremental rollout are explicitly skipped.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  access,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(
  await realpath(path.join(web, "../api/node_modules/tsx/package.json")),
);
const { chromium } = await import(
  process.env.WODLY_PLAYWRIGHT_MODULE || "playwright-core"
);
const scratch = await mkdtemp(path.join(tmpdir(), "wodly-component-tests-"));
const present = async (file) =>
  access(path.join(web, file)).then(
    () => true,
    () => false,
  );
const families = {
  actions: await present("components/ui/IconButton.tsx"),
  feedback: await present("components/ui/Toast.tsx"),
  forms: await present("components/ui/FormControls.tsx"),
  layouts: await present("components/layout/StickyActions.tsx"),
};
const component = (file) => JSON.stringify(path.join(web, file));
const feedbackImports = families.feedback
  ? `import {ToastProvider, useToast} from ${component("components/ui/Toast.tsx")}; import useUnsavedChanges from ${component("components/ui/useUnsavedChanges.tsx")}; import {useConfirmationDialog} from ${component("components/ui/ConfirmationDialog.tsx")};`
  : "";
const formImports = families.forms
  ? `import FormField from ${component("components/ui/FormField.tsx")}; import {TextInput, Select, Textarea, SearchInput} from ${component("components/ui/FormControls.tsx")};`
  : "";
const layoutImports = families.layouts
  ? `import StickyActions from ${component("components/layout/StickyActions.tsx")}; import ListItem from ${component("components/ui/ListItem.tsx")}; import LoadingState from ${component("components/ui/LoadingState.tsx")}; import EmptyState from ${component("components/ui/EmptyState.tsx")};`
  : "";
const fixture = `import React, {useState} from 'react'; import {createRoot} from 'react-dom/client';
import Button from ${component("components/ui/Button.tsx")};
${feedbackImports} ${formImports} ${layoutImports}
${
  families.feedback
    ? `function Feedback() {
const {notify} = useToast(); const {confirm,dialog} = useConfirmationDialog(); const [dirty,setDirty]=useState(false); const [result,setResult]=useState('');
const guard=useUnsavedChanges({dirty,message:'Preserve these training notes.'});
return <section aria-label="Feedback tests"><Button type="button" onClick={()=>notify({message:'Saved result',variant:'success'})}>Success toast</Button>
<Button type="button" onClick={()=>{for(let n=0;n<5;n++)notify({message:'Info '+n,variant:'info'});}}>Toast limit</Button>
<Button type="button" onClick={()=>notify({message:'Save failed',variant:'error',action:{label:'Retry save',onClick:()=>setResult('Retried')}})}>Retry toast</Button>
<Button type="button" onClick={async()=>setResult(await confirm({description:'Remove this item?',confirmLabel:'Delete item'})?'Deleted':'Cancelled')}>Open confirmation</Button>
<Button type="button" onClick={async()=>setResult(await guard.confirmDiscard()?'Discarded':'Stayed')}>Leave editor</Button>
<label>Draft<input aria-label="Draft" value={dirty?'Unsaved':''} onChange={()=>setDirty(true)} /></label><output>{result}</output>{dialog}{guard.dialog}</section>;
}`
    : ""
}
${
  families.forms
    ? `function Forms() {const [value,setValue]=useState(''),[error,setError]=useState(''); return <section aria-label="Form tests">
<FormField label="Class name" required help="Choose a readable name." error={error}>{props=><TextInput {...props} value={value} onChange={e=>{setValue(e.target.value);setError('');}} onBlur={()=>{if(!value)setError('Enter a name');}}/>}</FormField>
<FormField label="Optional notes">{props=><Textarea {...props} rows={3}/>}</FormField>
<FormField label="Capacity">{props=><TextInput {...props} type="number" min={1} max={100}/>}</FormField>
<FormField label="Variation">{props=><Select {...props}><option value="rx">Rx</option><option value="scaled">Scaled</option></Select>}</FormField>
<FormField label="Locked date" help="Bookings lock this date.">{props=><TextInput {...props} type="date" value="2026-10-09" disabled/>}</FormField>
<SearchInput aria-label="Search athletes"/><Button type="button" variant="secondary">Move focus</Button></section>;}`
    : ""
}
function App(){const [busy,setBusy]=useState(false),[submitted,setSubmitted]=useState(0),[chosen,setChosen]=useState(false);return <main className="mx-auto max-w-xl px-4 py-5">
<section aria-label="Action tests"><form onSubmit={e=>{e.preventDefault();setSubmitted(n=>n+1);}}><Button type="submit" isLoading={busy}>{busy?'Saving result…':'Save result'}</Button><output aria-label="Submissions">{submitted}</output></form>
<Button type="button" variant="secondary" onClick={()=>setBusy(b=>!b)}>Toggle loading</Button><Button type="button" variant="ghost">Back</Button><Button type="button" variant="danger">Remove</Button><Button type="button" size="sm">Small</Button><Button type="button" size="lg">Large</Button><Button type="button" size="icon" aria-label="More actions">+</Button></section>
${families.feedback ? "<Feedback/>" : ""}${families.forms ? "<Forms/>" : ""}
${families.layouts ? `<section aria-label="Layout tests"><ListItem selected={chosen} onClick={()=>setChosen(!chosen)}>Choose class</ListItem><EmptyState title="No classes" description="Try another date."/><LoadingState label="Loading schedule"/><StickyActions><Button type="button" className="w-full lg:w-auto">Sticky save</Button></StickyActions></section>` : ""}
<nav aria-label="Test navigation" className="fixed inset-x-0 bottom-0 h-16 border-t border-border bg-background lg:hidden">Classes</nav>
</main>};createRoot(document.getElementById('root')).render(${families.feedback ? "<ToastProvider><App/></ToastProvider>" : "<App/>"});`;
const mocks = {
  "next-intl": `export function useTranslations(namespace) {return (key)=>window.__messages[namespace][key];}`,
  "next/navigation": `export function useRouter(){return {push:()=>{}};}`,
};
let browser, server;
try {
  await require("esbuild").build({
    stdin: { contents: fixture, loader: "tsx", resolveDir: web },
    bundle: true,
    outfile: path.join(scratch, "bundle.js"),
    jsx: "automatic",
    tsconfig: path.join(web, "tsconfig.json"),
    define: { "process.env.NODE_ENV": '"test"' },
    plugins: [
      {
        name: "test-boundaries",
        setup(build) {
          build.onResolve(
            { filter: /^(next-intl|next\/navigation)$/ },
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
  const cssFiles = (
    await readdir(path.join(web, ".next/static/chunks"))
  ).filter((f) => f.endsWith(".css"));
  assert.ok(cssFiles.length, "Compile Next.js CSS first");
  const css = (
    await Promise.all(
      cssFiles.map((f) =>
        readFile(path.join(web, ".next/static/chunks", f), "utf8"),
      ),
    )
  ).join("\n");
  const js = await readFile(path.join(scratch, "bundle.js"));
  server = http.createServer((req, res) => {
    res.setHeader(
      "Content-Type",
      req.url === "/bundle.js"
        ? "text/javascript"
        : req.url === "/style.css"
          ? "text/css"
          : "text/html",
    );
    res.end(
      req.url === "/bundle.js"
        ? js
        : req.url === "/style.css"
          ? css
          : '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    executablePath: process.env.WODLY_CHROMIUM || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  for (const width of [375, 390, 430, 768, 1024, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.setDefaultTimeout(10000);
    const common = JSON.parse(
      await readFile(path.join(web, "messages/en.json"), "utf8"),
    ).common;
    await page.addInitScript(
      (messages) => {
        window.__messages = messages;
      },
      { common },
    );
    await page.goto(origin);
    const save = page.locator("form").first().getByRole("button");
    await save.waitFor();
    const before = await save.boundingBox();
    await save.click();
    assert.equal(await page.getByLabel("Submissions").innerText(), "1");
    await page
      .getByRole("button", { name: "Toggle loading", exact: true })
      .click();
    assert.equal(await save.isDisabled(), true);
    assert.equal(await save.getAttribute("aria-busy"), "true");
    if (families.actions)
      assert.equal((await save.boundingBox()).width, before.width);
    await save.click({ force: true });
    assert.equal(await page.getByLabel("Submissions").innerText(), "1");
    await page
      .getByRole("button", { name: "Toggle loading", exact: true })
      .click();
    if (families.actions) {
      assert.ok(before.height >= 48);
      assert.ok(
        (
          await page
            .getByRole("button", { name: "Large", exact: true })
            .boundingBox()
        ).height >= 56,
      );
      assert.ok(
        (await page.getByRole("button", { name: "More actions" }).boundingBox())
          .height >= 44,
      );
    }
    if (families.feedback) {
      const trigger = page.getByRole("button", {
        name: "Open confirmation",
        exact: true,
      });
      await trigger.click();
      const dialog = page.getByRole("alertdialog");
      await dialog.waitFor();
      const cancel = dialog.getByRole("button", {
        name: common.cancel,
        exact: true,
      });
      assert.equal(
        await cancel.evaluate((el) => el === document.activeElement),
        true,
      );
      await page.keyboard.press("Shift+Tab");
      assert.equal(
        await page.evaluate(() =>
          Boolean(document.activeElement.closest("dialog")),
        ),
        true,
      );
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.equal(
        await trigger.evaluate((el) => el === document.activeElement),
        true,
      );
      assert.equal(
        await page.locator("output").last().innerText(),
        "Cancelled",
      );
      await trigger.click();
      await dialog
        .getByRole("button", { name: "Delete item", exact: true })
        .click();
      assert.equal(await page.locator("output").last().innerText(), "Deleted");
      await page.getByLabel("Draft", { exact: true }).fill("Unsaved");
      await page
        .getByRole("button", { name: "Leave editor", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: common.stay, exact: true })
        .click();
      assert.equal(
        await page.getByLabel("Draft", { exact: true }).inputValue(),
        "Unsaved",
      );
      assert.equal(await page.locator("output").last().innerText(), "Stayed");
      await page
        .getByRole("button", { name: "Success toast", exact: true })
        .click();
      const toast = page.getByText("Saved result", { exact: true });
      await toast.waitFor();
      await toast.waitFor({ state: "hidden", timeout: 6000 });
      await page
        .getByRole("button", { name: "Toast limit", exact: true })
        .click();
      const region = page.getByLabel(common.feedback, { exact: true });
      assert.equal(await region.getByRole("status").count(), 3);
      await region
        .getByRole("button", { name: common.close, exact: true })
        .first()
        .click();
      assert.equal(await region.getByRole("status").count(), 2);
      await page
        .getByRole("button", { name: "Retry toast", exact: true })
        .click();
      await region
        .getByRole("button", { name: "Retry save", exact: true })
        .click();
      assert.equal(await page.locator("output").last().innerText(), "Retried");
      if (width < 1024) {
        const bar = await page.getByRole("navigation").boundingBox();
        const notification = await region.boundingBox();
        assert.ok(
          notification.y + notification.height <= bar.y,
          "Toast overlaps navigation",
        );
      }
    }
    if (families.forms) {
      const field = page.getByRole("textbox", {
        name: "Class name",
        exact: true,
      });
      await field.focus();
      await page
        .getByRole("button", { name: "Move focus", exact: true })
        .click();
      await page.getByText("Enter a name", { exact: true }).waitFor();
      assert.equal(await field.getAttribute("aria-invalid"), "true");
      assert.ok(await field.getAttribute("aria-describedby"));
      await field.fill("CrossFit");
      assert.equal(
        await page.getByText("Enter a name", { exact: true }).count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("textbox", { name: "Optional notes", exact: true })
          .getAttribute("required"),
        null,
      );
      assert.equal(
        await page.getByLabel("Locked date", { exact: true }).isDisabled(),
        true,
      );
      assert.ok((await field.boundingBox()).height >= 48);
    }
    if (families.layouts) {
      const row = page.getByRole("button", {
        name: "Choose class",
        exact: true,
      });
      await row.click();
      assert.equal(await row.getAttribute("aria-pressed"), "true");
      const loading = page
        .getByRole("status")
        .filter({ hasText: "Loading schedule" });
      assert.equal(await loading.getAttribute("aria-busy"), "true");
      const action = await page.locator("[data-sticky-actions]").boundingBox(),
        nav = page.getByRole("navigation");
      assert.equal(await nav.isVisible(), width < 1024);
      if (width < 1024) {
        const bounds = await nav.boundingBox();
        assert.ok(action.y + action.height <= bounds.y + 1);
        await page
          .getByRole("button", { name: "Sticky save", exact: true })
          .scrollIntoViewIfNeeded();
      }
    }
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow at ${width}`,
    );
    assert.deepEqual(errors, []);
    console.log(`PASS shared component interactions and layout: ${width}`);
    await page.close();
  }
  for (const [family, available] of Object.entries(families))
    console.log(
      `${available ? "PASS" : "SKIP not yet present"} family: ${family}`,
    );
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await rm(scratch, { recursive: true, force: true });
}
