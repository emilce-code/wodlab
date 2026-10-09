# WODLY internal UI verification

Approved Global Design System v1 (#298) supersedes the older screenshot-evidence policy. Verify the running application internally; do not create or commit mockups, screenshots, recordings, visual reports or QA artifacts. PR delivery contains only a concise implementation summary, checks, PR link and significant blockers.

## Internal checks

- Read approved feature requirements, exclusions and design references when available. Report unavailable references; do not claim visual parity without inspecting them.
- Check 375x812, 390x844, 430x932, 768x1024, 1024px and 1440px widths where practical.
- Preserve feature hierarchy, information order, permissions and business rules. Use the shared dark palette, typography, controls and en/es/pt labels.
- Check overflow, readable locked values, loading, empty, error, success and validation states.
- Verify keyboard focus, dialog containment and dismissal, focus return, safe areas and reduced motion.
- Preserve mobile bottom navigation on standard detail/edit pages and desktop sidebar only. Sticky actions must not obscure controls or navigation.
- Run relevant tests, lint, type checks and builds. Distinguish repository defects and unavailable tools from passing checks.

Visual consistency and functional correctness require separate internal checks; neither substitutes for the other.
