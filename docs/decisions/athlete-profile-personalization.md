# Athlete profile personalization

## Decision

The athlete profile owns identity, training defaults, goals and privacy.
Detailed history, records, analytics, classes and coaching remain in their
existing modules; the profile only summarizes and links to those experiences.

The NestJS athlete-profile API owns the personalization contract so the web app
and a future native client share validation and behavior.

## Added preferences

- Optional HTTPS avatar URL and short training bio
- Multiple training goals
- Weekly training-session target from one to seven
- Load rounding increment of 0.5, 1, 2.5 or 5 in the preferred weight unit

Health, injury and body-composition data are excluded until a specific feature
and privacy model require them.

## Mobile experience

The profile leads with compact summaries and high-value shortcuts. Settings use
touch-friendly controls and collapsible sections. The sticky save action is
disabled when there are no changes.
