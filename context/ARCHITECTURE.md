# Architecture

> How DhikrForest is put together: layers, data flow, storage and the Firestore schema.
> Read before adding features that touch state, sync or rendering, so code lands in the right layer.
> Update when a module, data shape or rule changes.

## Layers
```
src/
├── App.tsx                 wires hooks → Panel / ForestSide / modals; global Enter/Space listener via plantGuard
├── hooks/
│   ├── useSavedState.ts    load/save signed state (debounced 400 ms, flush on pagehide, cross-tab adopt)
│   ├── useForestState.ts   plant/reset, pages, toasts, leaves, daily goal + streak, pending leaderboard amount
│   ├── useQadr.ts          Qadr status (ticks every 30 s), activate once/year, auto-off at Fajr
│   ├── useCloud.ts         loads Firebase on idle, auth state, public profile, nickname validation
│   ├── useCloudSync.ts     flush pending trees every 15 s, private forest backup every 60 s, Qadr cross-device
│   ├── useTimeOfDay.ts     sky theme (auto by hour, or manual)
│   └── useInstallPrompt.ts beforeinstallprompt / iOS hint
├── lib/                    pure logic: forestSegments, secureStore, plantGuard, qadr (Hijri via Intl umalqura + adhan), share
├── firebase/cloud.ts       ALL Firebase calls (dynamic import only)
├── components/
│   ├── Forest/             ForestCanvas (single canvas, cached pine sprites in treeSprites.ts), Pagination, Flash
│   ├── Panel/              Counter, ZikrBlock/Nav, PlantButton, StatsRow, MilestonePane, QadrToggle, sky (Stars/Moon/Sun)
│   ├── Toolbar/            bottom bar + Settings / Account modals
│   ├── Leaderboard/        weekly / all-time board, rank, community total (60 s cache)
│   └── Modal/              shared portal dialog (Esc, backdrop, focus return)
└── data/zikrs.ts           dhikr text + milestones
```

## Local state (`SavedState`, key `dhikrforest_state_v3` + `_bak`)
`{ v:3, segments:[{t:'standard'|'qadr', n}], daily:{day,count}, streak:{count,lastGoalDay}, goal, qadr:{hijriYear,activatedAt,expiresAt}|null, pending:{uid,amount}|null, haptics, coords }`
Saved as `{ d: state, s: keyedHash(secret|deviceId|json) }`. Bad signature → restore backup → else fresh state + toast. Legacy keys (`zikr_tree_items_v2`, `zikr_tree_count`, `zikr_trees`) migrate once, only on a device with no device id yet.

## Forest model
- 1,000 slots per page (50 × 20). A Qadr tree is 1 slot worth 1,000 (`QADR_MULTIPLIER`).
- Each tree's sprite, size and jitter are seeded by its global index (`utils/prng.ts`), so pages look stable.
- Canvas redraws only on items change / resize / grow animation.

## Firestore schema (`firestore.rules`)
- `users/{uid}` (public read, owner write): `nickname, total, weekTotal, weekIndex, lastSync, createdAt, qadrActivatedAt, qadrExpiresAt`.
  - Sync update: ≥5 s since `lastSync` (server time), `0 < delta ≤ min(elapsed·16+16, 5000) × (1000 if within 24 h of qadrExpiresAt)`, `weekIndex = floor((ms+3d)/7d)` (Monday UTC), weekTotal consistent.
  - Qadr activation: only those two fields, ≥300 days since the last, ≤14 h long. Rename: nickname only. Delete: never.
- `users/{uid}/private/forest` (owner only): `segments, goal, streak, daily, updatedAt`. Merge on sign-in: bigger forest wins.
- Index: `weekIndex ASC + weekTotal DESC/ASC` (weekly board + rank count).
- Leaderboard only counts trees planted while signed in with a nickname (`syncUid`).

## PWA
`vite.config.ts` → manifest + Workbox precache of js/css/html/png/woff2 (screenshots and OG image excluded). `registerType: autoUpdate`.
