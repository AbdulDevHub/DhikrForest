import { GRID_COLS, TREES_PER_PAGE } from './constants';

export function numPages(totalItems: number): number {
  return Math.max(1, Math.ceil(totalItems / TREES_PER_PAGE));
}

export function numRows(treeCount: number): number {
  return Math.ceil(treeCount / GRID_COLS);
}

/** Returns the column and row (0-indexed) for a given slot index on a page (0 to 999). */
export function slotToGrid(slotIndex: number) {
  const col = slotIndex % GRID_COLS;
  const row = Math.floor(slotIndex / GRID_COLS);
  return { col, row };
}
