# DhikrForest — AI Developer Context & Architecture Guide

## Overview
**DhikrForest** is a web application designed as an offline-first dhikr counter. It visualizes daily remembrance (dhikr) as a growing forest.

## Tech Stack
- **Framework / Bundler**: React 18 + TypeScript + Vite
- **Styling**: CSS Modules (`*.module.css`) + Vanilla CSS variables (`src/index.css`)
- **Icons & Fonts**: Google Fonts (Amiri, Tajawal) loaded in `index.html`
- **State Management**: Custom React hooks (`useForestState`, `useStoredNumber`) backed by browser `localStorage`

## Project Structure
```
DhikrForest/
├── index.html               # Main HTML entry point & font loading
├── public/                  # Static assets (favicons, icons)
├── AGENTS.md                # Project architecture & context guide for AI assistants
├── src/
│   ├── main.tsx             # React DOM root render
│   ├── App.tsx              # Root component connecting state to UI
│   ├── index.css            # Design tokens, variables, global reset
│   ├── components/
│   │   ├── Forest/          # Dirt background canvas, pagination, top-view tree grid
│   │   │   ├── ForestSide.tsx    # Canvas wrapper & layout manager
│   │   │   ├── ForestCanvas.tsx  # Grid container rendering page items
│   │   │   ├── Pagination.tsx    # Page prev/next and indicator controls
│   │   │   ├── Tree.tsx          # Top-view standard tree & special Qadr tree component
│   │   │   ├── Flash.tsx         # Planting flash visual effect
│   │   │   └── Forest.module.css # Dirt ground styling & grid layouts
│   │   ├── Panel/           # Left control drawer & counter stats
│   │   │   ├── Panel.tsx         # Side panel assembly
│   │   │   ├── Counter.tsx       # Total tree counter display
│   │   │   ├── ZikrBlock.tsx     # Current Arabic zikr text & transliteration
│   │   │   ├── PlantButton.tsx   # Primary dhikr plant button
│   │   │   ├── HadithPanel.tsx   # Hadith popover modal ("About these Zikrs")
│   │   │   ├── QadrToggle.tsx    # Laylatul Qadr mode toggle button
│   │   │   └── Panel.module.css  # Drawer styles & popover layout
│   │   ├── Leaves/          # Floating particle animation component
│   │   └── Toast/           # Toast notification banner
│   ├── data/
│   │   └── zikrs.ts         # Zikr definitions, multipliers, and milestones
│   ├── hooks/
│   │   ├── useForestState.ts   # Core application state & storage persistence
│   │   └── useStoredNumber.ts # LocalStorage sync helper
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces & types
│   └── utils/
│       ├── constants.ts     # Configuration constants (TREES_PER_PAGE=1000, keys)
│       └── geometry.ts      # Grid layout helpers
```

## Key Concepts & Conventions
1. **Tree Types & Pagination**:
   - Each page holds up to **1,000 tree items** arranged in a uniform top-down grid.
   - Standard zikrs add standard trees (1 tree for SubhanAllah wa bihamdihi, 4 trees for 4-word zikr).
   - In **Laylatul Qadr mode**, 1 click plants 1 or 4 **special golden-emerald trees** (`type: 'qadr'`). Each special tree represents **1,000 trees** in value towards the counter, but occupies **1 slot** on the page grid. Hovering over special trees shows `x1000`.
2. **Hadith Popover**:
   - Fixed modal positioned independently to avoid container `overflow: hidden` clipping.
3. **Styling Rules**:
   - Use CSS Modules for component-specific styles (`styles.className`).
   - Use global tokens defined in `src/index.css` for palette consistency.
