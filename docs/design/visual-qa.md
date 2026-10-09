# WODLY UI visual QA & PR evidence

For every approved screen, link the corresponding design version and reference asset(s). The reference is the **approved** asset, not arbitrary later generated artwork.

## Required verification
- [ ] Approved scope, exclusions and issue links are read.
- [ ] Reference images exist and were personally inspected (otherwise mark unavailable; do not claim parity).
- [ ] Baseline before/after screenshots captured from the running app.
- [ ] Checked 375x812, 390x844, 430x932, 768x1024 and 1280x800 where practical.
- [ ] Logo, hierarchy, spacing, color tokens and font scale match approved contract.
- [ ] No added/unapproved information or large cards, cover photos or banners.
- [ ] Interactive sheets/dialogs, keyboard/focus, dismissal and safe-area behavior verified.
- [ ] Empty/loading/error/success states checked.
- [ ] Permission controls verified on UI and API, including cross-tenant cases.
- [ ] en/es/pt labels and small viewport overflow checked.
- [ ] Tests/build result and known blockers documented.
- [ ] Remaining visual differences listed in PR (or none after real comparison).

## Evidence table for PR

| Screen/state | Viewport | Approved reference | Actual screenshot | Delta/fix | Verified? |
|---|---|---|---|---|---|
| Athlete details | 390x844 | [link or missing] | [link] | [notes] | No |
| Contact sheet | 390x844 | [link or missing] | [link] | [notes] | No |
| Directions sheet | 390x844 | [link or missing] | [link] | [notes] | No |
| Owner edit form | 390x844 | [link or missing] | [link] | [notes] | No |
| Validation/saving | 375x812 | [link or missing] | [link] | [notes] | No |

Visual similarity is not equivalent to functional correctness. Report both separately. If the browser or test environment cannot open the app, explain the limitation rather than reporting a passing visual comparison.
