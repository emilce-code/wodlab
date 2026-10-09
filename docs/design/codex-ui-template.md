# Reusable Codex UI implementation brief template

> Use only after the owner authorizes implementation. Populate feature-specific values; never claim a design is approved if it isn't.

Repository: `emilce-code/wodlab`
Base: `develop`
Feature: `<feature name + approved design version>`
Issues: `<issue links>`
Approved specification: `docs/design/<feature>/spec.md`
Approved reference images: `<repo image paths — mandatory for pixel-oriented parity claims>`

## Instructions to Codex

1. Read `AGENTS.md`, all linked issues, feature specification, and inspect each approved reference **file**. Summarize scope, exclusions and conflicts; inspect relevant current components/tokens.
2. Identify intended files and existing reusable UI before editing. Avoid unrelated changes. Treat images as visual references and written approved requirements as authoritative when generated artwork accidentally shows excluded controls.
3. Implement the athlete/owner screens and interaction states exactly according to contract. Don't add attractive but unapproved sections. Preserve backend authorization, backward compatibility, en/es/pt and mobile behavior.
4. Launch the app (when available), take screenshots with Playwright or equivalent at 375x812, 390x844, 430x932, 768x1024, 1280x800. Include default, sheet and form states.
5. Compare screenshots with **the actual approved image files**, not a recollection; fix measurable alignment/hierarchy/spacing discrepancies. Repeat screenshot review. If assets or browser unavailable, report *visual comparison blocked* rather than claiming parity.
6. Run applicable lint, TS checks, tests/build and document pass/failure honestly.
7. Open a PR targeting `develop` with actual screenshots, the evidence table in `docs/design/visual-qa.md`, deviations, tests and links to issues. Never merge automatically.

## Forbidden
- Replacing functional specs with vibes or visual improvisation.
- Adding new models/sections outside approved scope.
- Claiming visual parity without inspected rendered screenshots and matching approved reference assets.
- Changing issue statuses/closing issues before verified completion.
