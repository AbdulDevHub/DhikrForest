# 🌳 Zikr - Plant Trees in Jannah

> A beautiful, offline-first dhikr (remembrance) counter that visualises your worship as a growing forest in Jannah.

Every time you recite a dhikr, a tree is planted in your personal Jannah forest. Built around a well-known hadith:

> *"Whoever says 'Subḥānallāhi wa biḥamdihī' one hundred times a day, his sins will be forgiven even if they were as much as the foam of the sea."*
> - Ṣaḥīḥ al-Bukhārī & Muslim

This is a Vite + React + TypeScript port of the original single-file HTML app, with the same look, feel, and behavior.

---

## 🖥️ Features

| Feature | Description |
|---|---|
| 🌿 **Two dhikrs** | Switch between *Subḥānallāhi wa biḥamdihī* (1 tree) and the four-phrase dhikr (4 trees) |
| 🌙 **Laylatul Qadr mode** | Toggle to multiply every deed ×1000, reflecting the night worth a thousand months |
| 🌳 **Growing forest** | Up to 1,500 trees rendered live in a scrollable Jannah landscape |
| 🎉 **Milestones** | Toast notifications at 10, 25, 50, 100 … 1,000,000,000,000 trees |
| 💾 **Persistent storage** | Your tree count survives page reloads via `localStorage` |
| ⌨️ **Keyboard support** | Press `Enter` or `Space` to plant - no mouse needed |
| 📖 **Hadith panel** | Tap *"About these Zikrs"* to read the source hadith for each dhikr |
| 🔄 **Reset** | Clear all data and start fresh at any time |

---

## 🚀 Getting Started

Requires [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev       # start the dev server
pnpm build     # production build → dist/
pnpm preview   # preview the production build locally
```

---

## 📁 Project Structure

```
zikr/
├── index.html
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Top-level composition + keyboard handling
│   ├── index.css                 # Reset, CSS variables, page layout
│   ├── types/                    # Shared TS types
│   ├── data/zikrs.ts             # ZIKRS + MILESTONES content
│   ├── utils/                    # Geometry, PRNG, tree-shape, constants
│   ├── hooks/
│   │   ├── useForestState.ts     # Core app state: plant/reset, toasts, leaves, glow
│   │   └── useStoredNumber.ts    # localStorage-backed number state
│   └── components/
│       ├── Panel/                # Left night-sky sidebar (counter, dhikr, controls)
│       ├── Forest/                # Right-side scrollable tree canvas
│       ├── Toast/                # Milestone / welcome-back toast
│       └── Leaves/               # Flying leaf particles on each plant
└── package.json
```

---

## 🛠️ Customisation

- **`src/data/zikrs.ts`** - add, remove, or edit dhikr entries, and milestone thresholds/messages
- **`src/utils/constants.ts`** - `COLS` (trees per row), `ROW_H` (row height), `VISUAL_CAP` (max trees rendered at once)

---

## 🤲 Intention

This tool is built as a gentle aid for the heart - not a replacement for sincerity, focus, or presence in worship. May every tree planted here be a witness on the Day of Judgement.

*"And your Lord is not forgetful."* - Maryam 19:64

---

## 📄 Licence

MIT - free to use, share, and build upon. If you improve it, consider sharing back.
