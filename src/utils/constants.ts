export const TREES_PER_PAGE = 1000;
export const GRID_COLS = 50; // 50 columns x 20 rows = 1000 slots per page
export const GRID_ROWS = 20;

/** A Laylatul Qadr tree is worth this many standard trees. */
export const QADR_MULTIPLIER = 1000;

/** Fastest allowed gap between two plants (ms). Stops auto-clickers and key spam. */
export const PLANT_MIN_GAP_MS = 250;

export const DAILY_GOALS = [33, 100, 300, 1000] as const;

export const SITE_URL = 'https://dhikrforest.netlify.app/';

export const STORAGE_KEYS = {
  state: 'dhikrforest_state_v3',
  stateBackup: 'dhikrforest_state_v3_bak',
  device: 'dhikrforest_device',
  timeMode: 'dhikr_time_mode',
  // Pre-v3 keys, migrated once then removed.
  legacyTotalTrees: 'zikr_trees',
  legacyTreeItems: 'zikr_tree_items_v2',
  legacyTreeCount: 'zikr_tree_count',
  legacyPositions: 'zikr_positions',
} as const;

export const PALETTES = [
  { top: '#34d399', mid: '#10b981', bot: '#059669' },
  { top: '#4ade80', mid: '#22c55e', bot: '#16a34a' },
  { top: '#2dd4bf', mid: '#14b8a6', bot: '#0d9488' },
  { top: '#a3e635', mid: '#84cc16', bot: '#65a30d' },
];
