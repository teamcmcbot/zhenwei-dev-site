# Portfolio Site Plan (Current)

## Goal

Maintain a data-driven React portfolio hosted as static assets, with a single canonical intro payload for identity/about/contact and dedicated JSON files for list-heavy sections.

## Current Architecture

- Frontend: Vite + React SPA
- Runtime content: static JSON under `site/public/data/`
- Hosting target: S3 + CloudFront
- Infra: Terraform in `terraform/`

## Data Model (Canonical)

Runtime data files in active use:

- `intro.json` (identity, terminal config, about, contact)
- `skills.json`
- `certifications.json`
- `experiences.json`
- `projects.json`
- `aws-static-hosting.json`

Removed as obsolete in May 2026:

- `profile.json`
- `about.json`
- `contact.json`

## Active UI Composition

`App.jsx` renders:

- `Header`
- `IntroTerminal`
- `Skills`
- `Certifications`
- `Experience`
- `Projects`
- `AwsStaticHosting`
- `Footer`

## Loader Contract

`site/src/lib/data.js` loads only active JSON files listed above and returns the same object shape consumed by `App.jsx`.

## Cleanup Completed

- Removed dead components: Hero, About, Contact
- Removed obsolete JSON fetch paths and return keys
- Removed dead CSS blocks tied to removed components
- Deleted obsolete data files

## Validation Checklist

- `npm run build` passes in `site/`
- No runtime references remain to removed JSON files
- No imports remain for removed components
- About/contact content still renders from `intro.json`

## Next Work

- Optional: split CI deploy path for app bundle changes vs data-only changes
- Optional: add lightweight schema checks for JSON contracts in CI
