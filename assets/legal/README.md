# Legal Documents (Versioned)

This directory uses a versioned structure for legal compliance and auditability.

## Structure

- `manifest.json`: source of truth for active versions and supported variants.
- `privacy/<region>/<language>/<version>.md`
- `terms/<region>/<language>/<version>.md`

Regions currently supported:

- `ng` = Nigeria (NDPA/NDPR context)
- `uk` = United Kingdom (UK GDPR/DPA 2018/PECR context)

Languages currently supported:

- `en`

## Versioning rules

- Increment minor version for non-material edits (clarity/wording).
- Increment major version for material legal changes (new rights basis, transfer terms, profiling, retention logic, etc.).
- Never overwrite old versions. Add a new file and update `manifest.json`.

## Acceptance tracking (app/backend)

When user accepts, store at minimum:

- userId
- documentType (`privacy` / `terms`)
- version
- region
- language
- acceptedAt
- appVersion
- source (onboarding/settings)

This supports NDPA/NDPR and UK GDPR accountability requirements.
