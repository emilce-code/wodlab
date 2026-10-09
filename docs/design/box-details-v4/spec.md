# Box Details — approved UI contract v4

**Status:** Approved design, implementation not started
**Approved:** 2026-10-08
**Repository:** `emilce-code/wodlab`
**Epic:** [#160](https://github.com/emilce-code/wodlab/issues/160)
**Scope:** [#162](https://github.com/emilce-code/wodlab/issues/162), [#163](https://github.com/emilce-code/wodlab/issues/163), [#164](https://github.com/emilce-code/wodlab/issues/164), [#165](https://github.com/emilce-code/wodlab/issues/165), [#166](https://github.com/emilce-code/wodlab/issues/166), [#167](https://github.com/emilce-code/wodlab/issues/167), [#168](https://github.com/emilce-code/wodlab/issues/168)
**Base branch for future implementation:** `develop`

## Source of truth and fidelity

The owner explicitly approved Box Details **design v4** in ChatGPT. The original approved presentation image is **not yet committed as a binary asset in GitHub**. Do not mistake new schematic drawings, conceptual mockups or earlier iterations for that approved image. Obtain/check in the approved reference before claiming image-to-code parity. This document records the approved structure/behavior and overrides unapproved illustrative extras appearing in image-generation boards.

Existing UI and tokens: `apps/web/app/globals.css`, `apps/web/app/[locale]/(app)/boxes/[boxId]/components/BoxDetailsView.tsx`, `apps/web/app/[locale]/(app)/box-admin/BoxAdministration.tsx`.
Design colors currently include background `#09090b`, surface `#161618`, elevated `#262626`, foreground `#f5f5f5`, muted `#a1a1aa`, border `#2a2a2e`, accent `#a3ff12`. These are actual repo tokens, not guessed from the generated image.

## 1. Athlete screen — top to bottom

1. Minimal back navigation and page title; no cover/banner photo or gradient hero.
2. Compact box identity: prominent ~80px square logo with fallback, box name, optional organization name and city/area. Organization is absent if unassigned.
3. Optional short description; omit entirely if blank.
4. **At most two compact primary contact shortcuts**, same-size tappable controls, chosen by available channels in order: WhatsApp, phone, email, Instagram, website. No inactive empty shortcuts.
5. A lightweight **Other contact options** row opens a modal bottom sheet listing all configured methods, including the primary two; omit the entry if no additional contact methods exist and shortcuts already expose all methods. No duplicate visible primary shortcuts on the main page.
6. **Location**: compact real map preview when valid coordinates exist, then readable address/location and a full-width lime **Get directions** button. Prefer not to surface raw coordinates or technical timezone details as major athlete content.
7. **View classes** action using existing box/class navigation. Do not break active-box semantics.

### Bottom sheet: Contact options

- Dark surface and rounded upper corners; readable label/icon/value for each available channel.
- Open the correct action or URL: WhatsApp, `tel:`, `mailto:`, Instagram, or `https:` link; format/normalize inputs safely and do not execute arbitrary protocols.
- Sheet closes by Close/Cancel, Escape and allowed backdrop interaction; keyboard focus moves into the sheet and returns to trigger on close.
- Respect device safe areas. Provide no empty sheet or noisy no-contact section.

### Bottom sheet: Directions

- Get directions opens the sheet; **never navigate immediately on that tap**.
- Destination display plus Google Maps and Apple Maps choices.
- Use valid `latitude,longitude` first, otherwise usable formatted address; hide button when neither is available.
- On map failure, keep address and external navigation available. Without coordinates, omit embedded map, but directions from address can remain.
- Choosing provider opens safe provider URL; dismiss/cancel leaves selected box unchanged. Accessible focus and localization.

## 2. Owner screen — Edit Box Details

- Dedicated **single scrolling page**, not a wizard or embedded member-management dashboard.
- Minimal back header; sticky Save remains operable on small phones and does not cover last form fields/safe area.
- Use section headings and spacing rather than repeated heavy nested cards.
- Sections in order: **Logo** (preview, change/remove, fallback); **Basic information** (required name, optional description; organization displayed read-only except authorized reassignment outside this ordinary flow); **Location** (optional address/coordinates and existing timezone behavior); **Contact** (optional WhatsApp, phone, email, Instagram, website).
- Do **not** include cover/banner image controls, live athlete preview, join code, member list or additional metadata.
- Save: show loading state, suppress double-submit, inline validation on bad fields, non-intrusive success feedback on the same page, useful error state preserving edits, and unsaved-change navigation guard.
- No newly invented mandatory fields: only name required unless the existing domain/data invariant legitimately requires more; do not mark description, city, country, address, coordinates or contacts required. Preserve timezone's current model/default constraints.
- Organization ownership reassignment cannot be exposed to ordinary box owners.

## 3. Model/API and authorization

- Add structured optional WhatsApp, phone, email, Instagram and website data, backward-compatible with existing `supportContact` multiline values. Handle old records gracefully and avoid duplicate visible contacts; do not destructively migrate existing data without a reviewed plan.
- Validate `latitude` range [-90,90], `longitude` [-180,180], email/URL formats and supported phone/contact formats. Exact validation can follow existing project conventions.
- Editing logo/name/description/location/contact requires ADMIN, authorized organization owner, or owner of that box. Coach is not automatically entitled to edit identity; athlete cannot edit. Backend must enforce scopes irrespective of UI visibility. Preserve separate coach operations elsewhere.
- Maintain translations in `en`, `es`, `pt`; use locale text for labels and error messages, never translate user-entered contact data.

## 4. Responsive visual contract

Reference target is phone viewport 390x844 CSS px. Also verify 375x812, 430x932, 768x1024, 1280x800. Approximate targets (subject to comparison with approved reference image): 16px horizontal screen gutter, ~80px identity logo, compact ~120px-high map, 44px+ tap targets; prefer actual repo design tokens to new hardcoded styles. Maintain clear typographic hierarchy, no horizontal scroll, clipped sheets or keyboard-hidden Save. Tablet/desktop may add constrained max-width/columns but must preserve ordered information and actions.

## 5. Explicitly excluded

No gym/box cover banner; no founded year, parking, amenities, pet-friendly status, class-type metadata, image gallery, owner live preview, payments/billing/membership plan work, join-code redesign, or organization admin/multi-box selector redesign. Do not add screens merely because earlier AI-generated mockups displayed them.

## 6. Definition of done (when implementation is separately authorized)

- All referenced GitHub acceptance criteria respected, including existing behavior outside scope.
- Render and inspect real screenshots for athlete, Contact sheet, Directions sheet, owner editor (default, invalid, saving/success) at mobile sizes.
- Compare screenshots with **the approved v4 reference once available**; list specific gaps and corrective iterations. If reference asset is unavailable, mark *visual parity not verified*.
- Check empty/missing/legacy data, map failure, action URLs, authorization (including cross-box), upload, validation, unsaved edits and three languages.
- Run relevant lint, TS, tests/build and include results and screenshot evidence in a PR to `develop`. Never self-merge.
