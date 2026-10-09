# Box Details v4

Implements the approved Box Details sections of Epic #160 and #162–#168. Organization membership plans, billing, and extra box metadata remain outside this change.

## Data and authorization

Box contact channels are nullable `whatsapp`, `phone`, `email`, `instagram`, and `website` columns. Apply `20261009000100_box_structured_contacts` with `pnpm --dir apps/api exec prisma migrate deploy` and regenerate the Prisma client before deploying the API. The additive migration preserves legacy `supportContact` and `coverImagePath` data.

Contact DTOs normalize international phone numbers and whitespace, validate email/Instagram/HTTP(S) URLs, and reject credential-bearing website URLs. Empty channels clear to null. Name retains its existing 2–80 character invariant. Timezone retains the UTC default. Coordinates are optional; edits must leave a complete valid pair or clear both.

`GET /boxes/:boxId` allows active members, relevant organization owners, and ADMIN users. Its `canEditDetails` capability is scoped to that box. `GET /boxes/managed` discovers boxes owned through active OWNER membership or organization ownership, including owners without a box membership; ADMIN can discover all boxes. Organization owners receive the existing `box:manage` navigation permission. The API still checks ownership on mutations; no coach operational permissions were removed.

Organization reassignment is reserved for ADMIN; it is absent from the ordinary profile form. Image mutations require ownership before storage side effects. Updated image paths must belong to the selected box, and removal never deletes another box's storage path.

## Web behavior

Athlete profiles, class headers, and dashboard box cards use a logo with a failed-image fallback, without banners. Profile shortcuts choose the first two available channels in WhatsApp, phone, email, Instagram, website order. The Contact options sheet exposes all channels and remaining legacy instructions; its trigger is hidden for one or two actions unless remaining legacy instructions require it. Recognizable legacy lines become actions without duplicating structured values; legacy text is not rewritten in storage or translated.

Directions use valid coordinates first, then address or area. Missing destinations hide the action. A real compact embedded map appears only for valid coordinates; directions remain available independently of map loading. Both sheets use native modal dialogs, keyboard focus cycling/restoration, Escape dismissal, and safe-area spacing.

The dedicated `/boxes/:boxId/edit` page contains Logo, Basic information, Location, Contact, and a sticky top-header Save action. Member/join-code operations remain in Box Administration. Logo changes persist immediately and are labeled accordingly. Profile changes remain local until Save succeeds. Failed saves preserve values, duplicate submissions are blocked, and unsaved changes trigger link/cancel and document-unload warnings. Browser history traversal also warns where the Navigation API supports canceling traversal. Older browsers retain link/cancel/unload protection but may not allow interception of every SPA history traversal.

All new UI strings are localized in English, Spanish, and Brazilian Portuguese. No application dependency was added.

## Validation commands

From the repository root after installing dependencies, generating Prisma, applying migrations, and seeding local PostgreSQL:

```bash
pnpm --dir apps/api test --runInBand boxes auth.service
pnpm test:e2e
pnpm --dir apps/api exec tsx --test ../web/test/box-details.test.mjs
pnpm lint
pnpm --dir apps/api build
pnpm --dir apps/web exec tsc --noEmit
pnpm --dir apps/web build
```

Component browser acceptance tests run the real views and forms with existing compiled Tailwind CSS, replacing auth/navigation/API/storage boundaries. Install browser tooling outside the checkout (for example `npm install --prefix /tmp/wodly-browser-tools playwright-core`), compile Next.js to produce CSS, and run:

```bash
WODLY_PLAYWRIGHT_MODULE=/tmp/wodly-browser-tools/node_modules/playwright-core/index.mjs \
WODLY_CHROMIUM=/usr/bin/chromium \
node apps/web/test/box-details.browser.mjs
```

These checks cover en/es/pt at 320px, sheet focus/dismissal, safe contact actions, missing fields, address fallback, blocked maps, failed logos, classes navigation, editor validation, failed saves, unsaved changes, duplicate saves, and logo optimization/upload/removal. Live Auth0 login, live Supabase storage, and Google map content are not validated by the mocked component suite.

## Visual fidelity review

See [visual QA results](../design/box-details-v4/visual-qa-results.md) for reference comparison, real Next.js screenshots at five viewports, fixture boundaries and remaining limitations. `apps/web/test/box-details.visual.mjs` reproduces these captures using external Playwright tooling without changing production authentication or adding dependencies.
