export const COLS = 50; // trees per row
export const ROW_H = 110; // px per row
export const BOT_PAD = 24; // px breathing room at canvas bottom
export const VISUAL_CAP = 1500; // max trees rendered in the DOM at once
export const MAX_TREE_COUNT = 5000; // hard cap on visually-tracked tree slots

export const STORAGE_KEYS = {
  totalTrees: 'zikr_trees',
  treeCount: 'zikr_tree_count',
  legacyPositions: 'zikr_positions',
} as const;

export const PALETTES: { top: string; mid: string; bot: string }[] = [
  { top: '#78dc68', mid: '#54c042', bot: '#308224' },
  { top: '#5cd054', mid: '#40a838', bot: '#24641c' },
  { top: '#64dcaa', mid: '#3ebc7c', bot: '#227c4c' },
  { top: '#d0e652', mid: '#a8c434', bot: '#6e8e1e' },
  { top: '#48ccaa', mid: '#2cae8c', bot: '#146e5a' },
  { top: '#6ce674', mid: '#48c454', bot: '#268434' },
];
