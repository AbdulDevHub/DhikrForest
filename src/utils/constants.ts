export const TREES_PER_PAGE = 1000;
export const GRID_COLS = 25; // 25 columns x 40 rows = 1000 slots per page
export const GRID_ROWS = 40;

export const STORAGE_KEYS = {
  totalTrees: 'zikr_trees',
  treeItems: 'zikr_tree_items_v2',
  legacyTreeCount: 'zikr_tree_count',
  legacyPositions: 'zikr_positions',
} as const;

export const PALETTES = [
  { top: '#34d399', mid: '#10b981', bot: '#059669' },
  { top: '#4ade80', mid: '#22c55e', bot: '#16a34a' },
  { top: '#2dd4bf', mid: '#14b8a6', bot: '#0d9488' },
  { top: '#a3e635', mid: '#84cc16', bot: '#65a30d' },
];
