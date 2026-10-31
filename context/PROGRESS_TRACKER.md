# Progress Tracker

> Running record of what works, what's in progress and what's next, plus a dated session log.
> Read at the start of a session to pick up where the last one stopped; append to the log at the end.
> Collapse stale log entries into "Earlier history" instead of deleting them.

## Current state
- Offline PWA dhikr counter with canvas pine forest (1,000 trees/page), sky themes, milestones, daily goal + streak, haptics, share.
- Anti-cheat: plant guard (key repeat, untrusted events, 250 ms gap), signed local storage with restore, Firestore rules validating every leaderboard sync (12 emulator tests pass).
- Laylatul Qadr: last 10 nights of Ramadan, once per Hijri year, ends at Fajr (geolocation + adhan, 05:00 fallback), synced across devices when signed in.
- Firebase project `dhikrforest`: Google sign-in enabled; authorized domains include `dhikrforest.netlify.app` and `localhost`; rules + indexes deployed.
- Leaderboard (weekly/all-time, rank, community total) and account modal (nickname, rename, pending count, sign-out).
- SEO: canonical/OG/Twitter → netlify URL, 1200×630 `og-image.png`, JSON-LD WebApplication + FAQ, sitemap/robots, README rewrite, MIT LICENSE.

## In progress
- Real sign-in end-to-end test (needs the owner's Google login): create nickname → plant → sync appears on board.

## Next steps
- GitHub repo: description, topics, homepage, social preview image (owner approval / manual upload).
- Google Search Console verification + sitemap submit (owner).
- Optional: App Check (reCAPTCHA v3) for bot protection; translations (Arabic/Urdu/Indonesian); Lighthouse pass.

## Session log
### 2026-10-30
- Rewrote storage as signed RLE segments (migrates legacy keys); added plantGuard, Qadr rules, daily goal/streak, haptics, share.
- Created Firebase project + web app, Google auth, Firestore rules/indexes with emulator tests (`pnpm test:rules`).
- Lazy Firebase module, sync hook (15 s), private forest backup, leaderboard + account + settings modals (shared Modal).
- Brought back the original pine-tree look, now drawn from cached canvas sprites; removed per-star/box-shadow/filter animations; mobile layout (forest on top).
- PWA via vite-plugin-pwa, generated icons, self-hosted fonts, verified offline reload.
- Fixed: wrong domain in SEO tags (dhikrforest.com doesn't exist), Arabic typo in the four-praises dhikr, mobile forest hidden at ≤720px.

### Earlier history
Vite/React/TS conversion, pagination layout with top-view trees, milestone pane, time-of-day themes, initial SEO tags.
