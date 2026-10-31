# AGENTS.md: DhikrForest

> Context for AI coding agents working in this repo. Read it first, then the files it points to.
> **Maintenance:** after any meaningful change to this project, update this file, `context/PROGRESS_TRACKER.md`,
> and the "Project Overview" section of `README.md` to reflect the current state. Do this proactively, without being asked.

## Overview
Offline-first dhikr counter (digital tasbih) PWA. Each dhikr plants a tree in a canvas-drawn forest; optional Google sign-in feeds an anti-cheat-validated leaderboard. Live: https://dhikrforest.netlify.app/ (Netlify builds `main`).

## Tech stack
React 19 + TypeScript 6 + Vite 8 (rolldown), CSS Modules + tokens in `src/index.css`, Firebase 13 (Auth Google + Firestore, project `dhikrforest`, lazy-loaded), `adhan` (prayer times), `vite-plugin-pwa` (Workbox generateSW), `@fontsource` (self-hosted Amiri/Tajawal), oxlint.

## Commands
- Install: `pnpm install` (pnpm 12; build scripts for `@firebase/util`, `protobufjs`, `re2` are deliberately denied in `pnpm-workspace.yaml`)
- Dev: `pnpm dev` (append `?now=2027-03-01T21:00` to fake the clock, dev builds only)
- Build: `pnpm build` · Lint: `pnpm lint`
- Rules tests: `pnpm test:rules` (needs Java 21+ on PATH for the Firestore emulator)
- Deploy rules/indexes: `npx firebase deploy --only firestore`
- Regenerate PNG icons from `public/favicon.svg`: `pnpm exec pwa-assets-generator`

Verify: pnpm build && pnpm lint

## Conventions & constraints
- Never store or read app state with raw `localStorage`: go through `useSavedState` / `lib/secureStore.ts` (signed blob). Forest is run-length `ForestSegment[]`; totals are derived, never stored.
- Every plant must pass `lib/plantGuard.ts` (no key repeat, `isTrusted`, 250 ms gap). Don't add other planting paths.
- `firebase/cloud.ts` is only reached through `loadCloud()` (dynamic import). Don't import Firebase statically.
- Firestore writes must satisfy `firestore.rules`; if you change one, change the other, mirror client helpers (`weekIndexOf`, `allowance`) and add a test in `tests/`.
- Qadr rules (last 10 nights, once per Hijri year, ends at Fajr) live in `lib/qadr.ts`; server mirrors them loosely (300 days, 14 h).
- Modals use `components/Modal/Modal.tsx` (portal). Use CSS Modules + tokens; animate only `opacity`/`transform` (no infinite box-shadow/filter animations).
- Hadith citations must be accurate with collection + number; don't invent wording.

## Boundaries
- `src/firebase/config.ts` holds the public web config (not secret). Don't add service-account keys anywhere.
- Don't delete the `users/{uid}` docs or loosen `allow delete: if false` (it would let users reset their Qadr night).
- `public/og-image.png`, `public/screenshots/`, `Screenshot.png` are generated from the running app with Playwright.

## More
`README.md` (plain overview, features, anti-cheat summary) · `context/PROGRESS_TRACKER.md` (state + log) · `context/ARCHITECTURE.md` (data flow, Firestore schema) · `context/UI_RULES.md` (layout, tokens, a11y).
