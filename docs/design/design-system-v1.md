# WODLY shared design system v1

Authority: [approved issue #298](https://github.com/emilce-code/wodlab/issues/298).
Feature-specific business requirements and approved workflows take precedence.

Extend the existing components in `apps/web/components/ui` and use the dark
palette in `apps/web/app/globals.css`. Keep existing fonts, icons and branding.
Semantic danger, warning, information and success tokens express state; lime
marks primary actions, selection and focus. Avoid adding accent to every label.

## Actions

`Button` and `ButtonLink` share primary, secondary, ghost/tertiary and danger
styles. Existing props and native form semantics remain supported. Default
controls are 48px, large actions 56px, icons at least 44px. Small controls remain
44px on mobile and may use 40px on desktop. `IconButton` requires an accessible
label. Loading preserves the action's width and accessible label while disabling
submission. Use one dominant primary action per group. `danger-solid` is reserved
for the final destructive confirmation, with safe Cancel as the default focus.

## Incremental adoption

Deliver separate foundation/actions, feedback/confirmation, form patterns,
cards/layout and targeted adoption PRs. Keep feature logic and data requirements
unchanged. Extend shared components before creating alternatives; explicit
feature layout requirements continue to apply. Do not mechanically convert an
entire screen or add new required fields, photos, statistics or workflow steps.

## Verification and delivery

Follow `docs/design/visual-qa.md` for internal responsive and interaction checks.
Do not create or commit screenshots, mockups, recordings or visual reports.
Deliver only a concise summary, checks, PR link and significant blockers. Do not
merge automatically or close #298 before review and completion.
