# Localized movement descriptions

## Status

Accepted

## Context

WODLY supports English, Spanish, and Portuguese in the web application. Movement
descriptions were previously stored only on `Movement.description`, so the API
could not return content in the athlete's active language. The movement API is
also intended for future non-web clients, so localization cannot live only in
Next.js message files.

## Decision

Store localized movement content in `MovementTranslation`, keyed by movement and
locale. The initial supported locale codes are `en`, `es`, and `pt`.

Movement read endpoints use the `Accept-Language` request header. They return the
requested translation when available, then fall back to English, then to the
legacy `Movement.name` and `Movement.description` fields. The response shape is
unchanged, so API consumers continue to read `name` and `description` without
needing translation-specific fields.

`Movement.description` remains available for custom movements and backward
compatibility. Seeded global movements receive an English translation, and the
nine foundational movements also receive curated Spanish and Portuguese
descriptions. Additional catalog translations can be added incrementally without
another schema change.

## Consequences

- Web and future mobile clients select content with the standard
  `Accept-Language` header.
- Missing translations degrade predictably instead of returning an empty value.
- Translation rows are deleted automatically with their movement.
- Search continues to use the canonical movement search text. Localized search
  is a separate future enhancement.
