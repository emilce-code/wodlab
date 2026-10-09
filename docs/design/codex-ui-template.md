# Reusable Codex UI implementation brief template

> Use only after the owner authorizes implementation. Populate feature-specific values; never claim a design is approved if it isn't.

Repository: `emilce-code/wodlab`
Base: `develop`
Feature: `<feature name + approved design version>`
Issues: `<issue links>`
Approved specification: `docs/design/<feature>/spec.md`
Approved reference images: `<task attachments or approved references — never commit reference images>`

## Instructions to Codex

1. Read `AGENTS.md`, all linked issues, feature specification, and inspect each approved reference **file**. Summarize scope, exclusions and conflicts; inspect relevant current components/tokens.
2. Identify intended files and existing reusable UI before editing. Avoid unrelated changes. Treat images as visual references and written approved requirements as authoritative when generated artwork accidentally shows excluded controls.
3. Implement the athlete/owner screens and interaction states exactly according to contract. Don't add attractive but unapproved sections. Preserve backend authorization, backward compatibility, en/es/pt and mobile behavior.
4. Launch the app when available and internally verify default, sheet and form states at 375x812, 390x844, 430x932, 768x1024, 1024px and 1440px. Do not create screenshot or recording artifacts.
5. Compare the running interface with the actual approved references; fix significant alignment, hierarchy and spacing discrepancies. If assets or browser are unavailable, report that limitation instead of claiming parity.
6. Run applicable lint, TS checks, tests/build and document pass/failure honestly.
7. Open a PR targeting `develop`. Deliver only a concise implementation summary, test/build results, PR link and significant blockers. Never merge automatically.

## Forbidden
- Replacing functional specs with vibes or visual improvisation.
- Adding new models/sections outside approved scope.
- Claiming visual parity without inspected rendered screens and matching approved reference assets.
- Changing issue statuses/closing issues before verified completion.
