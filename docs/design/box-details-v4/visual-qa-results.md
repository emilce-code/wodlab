# Box Details v4 visual QA

Reviewed against the [approved reference](wodly-box-details-v4-approved-reference.png), [written contract](spec.md), Epic #160 and approved sections of #162–#168. Base: `develop` at `b97556f`; branch: `feat/box-details-v4-visual-fidelity`.

## Verification checklist

- [x] Approved scope, exclusions and issue links read.
- [x] Committed reference image personally inspected.
- [x] Before/after screenshots captured from the running Next.js app.
- [x] All five requested viewport sizes captured.
- [x] Logo, hierarchy, spacing, token colors and typography compared and corrected.
- [x] No added cards, cover photos, banners, preview, member controls or join codes.
- [x] Sheets, keyboard focus, Escape, Cancel and focus restoration verified.
- [x] Missing fields, failed logos/maps, validation, saving, error and success checked.
- [x] Role controls checked in actual UI; API tests cover authorization and cross-tenant cases.
- [x] en/es/pt and small-screen overflow checked.
- [x] Tests/build results and blockers recorded below.
- [x] Remaining differences and verification limits recorded below.

## Capture method

These are actual Chromium screenshots of Next.js routes, including middleware, layout, translations, fonts and compiled CSS. The runner uses an ephemeral SDK-encrypted synthetic session and local HTTP API/storage fixtures. Production authentication code is unchanged. No live Auth0 or Supabase calls occur. Google map requests are deliberately blocked to exercise the real network fallback; capture waits for that fallback. The Next.js development indicator alone is hidden. Owner overview screenshots capture the entire scrolling form; other screenshots capture the viewport.

The baseline shows unmodified develop. Two 375px athlete/contact baseline files were accidentally overwritten during capture and omitted rather than presented as baseline evidence; the other 33 baseline screenshots remain available. Final evidence includes 40 screenshots across five viewports plus three localized save-error screenshots. Manifests record fixture boundaries and browser errors.

## Comparison and corrections

The baseline used a horizontal identity row, lacked the minimal profile header, gave classes the strongest accent, showed a taller map and kept a bottom navigation competing with the dedicated screen. The revised profile uses an 80px logo above the name, organization in accent, muted location, 16px gutters, compact 120px map, lime directions and a quiet classes row. Shortcuts and sheets now have consistent stroke icons and clearer row alignment. The options row is omitted when only one or two methods exist and there are no remaining legacy notes.

The editor now has a sticky top Save action, a 64px logo with change/remove controls, organization read-only before description, and a 96px location thumbnail. Fields retain 44px minimum height and 16px input text. Save remains accessible while scrolling to contacts. Existing optional-field and persistence behavior is retained.

## Evidence table

Each final state below was rendered at every requested viewport. The reference is the committed montage linked above; validation/loading/success follow the written contract because the montage does not show all these states.

| Screen/state | 375×812 | 390×844 | 430×932 | 768×1024 | 1280×800 | Delta / verification |
|---|---|---|---|---|---|---|
| Athlete details | [After](evidence/after/375x812-athlete.png) | [After](evidence/after/390x844-athlete.png) | [After](evidence/after/430x932-athlete.png) | [After](evidence/after/768x1024-athlete.png) | [After](evidence/after/1280x800-athlete.png) | Minimal header, vertical logo/name hierarchy, contextual shortcuts, compact map, primary directions and quiet classes action. Rendered and checked. |
| Contact sheet | [After](evidence/after/375x812-contacts.png) | [After](evidence/after/390x844-contacts.png) | [After](evidence/after/430x932-contacts.png) | [After](evidence/after/768x1024-contacts.png) | [After](evidence/after/1280x800-contacts.png) | Handle, close icon, channel icons and readable action rows. Rendered and checked. |
| Directions sheet | [After](evidence/after/375x812-directions.png) | [After](evidence/after/390x844-directions.png) | [After](evidence/after/430x932-directions.png) | [After](evidence/after/768x1024-directions.png) | [After](evidence/after/1280x800-directions.png) | Destination summary, Google/Apple rows, Cancel and safe-area padding. Rendered and checked. |
| Owner editor | [After](evidence/after/375x812-owner.png) | [After](evidence/after/390x844-owner.png) | [After](evidence/after/430x932-owner.png) | [After](evidence/after/768x1024-owner.png) | [After](evidence/after/1280x800-owner.png) | Sticky top Save, compact logo controls, organization read-only, map thumbnail and optional fields. Rendered and checked. |
| Validation | [After](evidence/after/375x812-validation.png) | [After](evidence/after/390x844-validation.png) | [After](evidence/after/430x932-validation.png) | [After](evidence/after/768x1024-validation.png) | [After](evidence/after/1280x800-validation.png) | Inline name error with editable values retained. Rendered and checked. |
| Saving | [After](evidence/after/375x812-saving.png) | [After](evidence/after/390x844-saving.png) | [After](evidence/after/430x932-saving.png) | [After](evidence/after/768x1024-saving.png) | [After](evidence/after/1280x800-saving.png) | Busy Save prevents duplicate submission. Rendered and checked. |
| Success | [After](evidence/after/375x812-success.png) | [After](evidence/after/390x844-success.png) | [After](evidence/after/430x932-success.png) | [After](evidence/after/768x1024-success.png) | [After](evidence/after/1280x800-success.png) | Success feedback and clean disabled Save. Rendered and checked. |
| Owner at bottom | [After](evidence/after/375x812-owner-bottom.png) | [After](evidence/after/390x844-owner-bottom.png) | [After](evidence/after/430x932-owner-bottom.png) | [After](evidence/after/768x1024-owner-bottom.png) | [After](evidence/after/1280x800-owner-bottom.png) | Sticky Save remains visible while last field is focused. Rendered and checked. |

Baseline comparison: [athlete](evidence/baseline/390x844-athlete.png), [contacts](evidence/baseline/390x844-contacts.png), [directions](evidence/baseline/390x844-directions.png), [owner](evidence/baseline/390x844-owner.png). See [baseline manifest](evidence/baseline/manifest.json) and [final manifest](evidence/after/manifest.json).

Save errors with input retained: [English](evidence/after/375x812-save-error-en.png), [Spanish](evidence/after/375x812-save-error-es.png), [Portuguese](evidence/after/375x812-save-error-pt.png).

## Functional results

- API focused tests: 4 suites, 51 tests passed, including ownership/cross-tenant restrictions and legacy contacts.
- Database integration tests: 2 suites, 15 tests passed.
- Contact/navigation helper tests: 5 passed.
- Component browser acceptance: 11 scenarios passed, including missing information, legacy actions, failed logos/maps, classes navigation, upload/removal, one/two-method sheet suppression and editor states.
- Actual Next.js runner: five viewport capture sets; en/es/pt sheets, focus/dismissal, save failure, unsaved guard, success and overflow assertions passed. ADMIN, organization owner and box owner can edit; coach and athlete cannot.
- Web/API lint and API build passed.
- Web production compilation passed, but type validation/build remains blocked by seven existing errors in app layout, auth completion and LocalePreferenceRedirect (`resolveCurrentUser` argument mismatch and missing `CurrentUser.preferredLocale`). These files are unchanged by this PR. No new TypeScript errors were reported.

## Remaining differences and limits

The mockup includes an athlete preview and extra required location inputs; the written approved exclusions take precedence, so these are intentionally absent. Optional fields remain optional. A clean form disables Save even though the reference illustrates an accented action. Existing WODLY tokens and Geist typography take precedence over generated-image gradients; provider rows use WODLY stroke icons rather than branded marks. Tablet/desktop preserve the existing centered content and desktop sidebar instead of stretching a phone montage.

Screenshots verify the map failure state, not live Google tiles. The iframe and directions remain real provider URLs. A network HEAD probe detects connection failures; opaque provider HTTP errors may not be detectable. Native map app handoff, physical mobile keyboard and device safe-area insets were not tested on hardware. Safe-area CSS and keyboard/focus behavior were tested in Chromium. There is no claim of exact pixel parity or live identity/storage verification.

## Reproduce

Install Playwright outside the checkout and provide a Chromium executable. From repository root:

```bash
WODLY_PLAYWRIGHT_MODULE=/path/to/playwright-core/index.mjs \
WODLY_CHROMIUM=/usr/bin/chromium \
node apps/web/test/box-details.visual.mjs after
```

The runner starts/stops its own Next.js and HTTP fixture servers; optional `WODLY_VISUAL_PORT` changes the default 3100 port. No application dependency or production environment file is added. This PR changes no API/schema/migration; the already merged structured-contact migration remains required for deployments that have not applied it.
