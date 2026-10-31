# UI Rules

> Layout, styling tokens, motion and accessibility rules for DhikrForest's interface.
> Use when adding or restyling components so the app stays consistent and fast on low-end phones.
> Update when tokens, breakpoints or shared patterns change.

## Layout
- Desktop: fixed-width left panel (`--panel-w: 340px`, scrolls if short) + forest fills the rest.
- ≤720px: `#root` is `column-reverse` → forest on top (42dvh, min 260px), panel below, whole page scrolls. Nothing may cause horizontal scroll (panel uses `overflow: clip`).
- Panel order: counter → dhikr → plant button → stats (Today/Streak/Session) → milestone → Qadr toggle → toolbar (Leaders, Share, Hadith, Settings, Account). Secondary options live in Settings, not the panel.

## Tokens (`src/index.css`)
`--gold #f5c842` (primary accent, counts), `--mint #7dd9b0` (secondary numbers), `--text-main`, `--text-dim` (overridden per sky theme in Panel.module.css), sky `--sky-top/mid/bot`. Plant button green `#1e7a38 → #2aaa50`. Fonts: Tajawal (UI), Amiri (Arabic), self-hosted.

## Motion & performance
- Animate only `opacity` / `transform`. Pulses are done with `::after` overlays fading opacity, never animated `box-shadow`/`filter`.
- No `backdrop-filter`. Stars are 3 box-shadow layers (not per-star nodes).
- Every infinite animation must be disabled under `prefers-reduced-motion`.
- Forest drawing stays on the single canvas; don't add per-tree DOM.

## Accessibility
- Real `<button>`s everywhere (`role="switch"` for Qadr, `role="tab"` for dhikr dots / board tabs).
- Global Enter/Space plants only when focus is on body or the plant button and no dialog is open.
- Counter wrapper is `aria-live="polite"`; toast is `role="status"`. Focus ring: 2px gold `:focus-visible`.
