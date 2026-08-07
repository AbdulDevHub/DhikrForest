import { BOT_PAD, COLS, ROW_H } from './constants';
import { pr } from './prng';

/** Canvas fills the right side. Row 0 = bottom. Rows stack upward. */
export function numRows(treeCount: number): number {
  return Math.max(1, Math.ceil(treeCount / COLS));
}

export function canvasHeightPx(treeCount: number): number {
  return numRows(treeCount) * ROW_H + BOT_PAD;
}

/** Deterministic per-tree scale, stable regardless of total tree count. */
export function treeScale(idx: number): number {
  return 0.5 + pr(idx * 41 + 7) * 0.5;
}

/** Top offset (px, from canvas top) for a tree in a given logical row. */
export function treeTopPx(logRow: number, scale: number, treeCount: number): number {
  const ch = canvasHeightPx(treeCount);
  const treeH = Math.round(115 * scale);
  const groundFromTop = ch - (BOT_PAD + logRow * ROW_H);
  return groundFromTop - treeH;
}

/** Center x% for a column. */
export function treeXpct(col: number): number {
  const step = 100 / COLS;
  return step * col + step * 0.5;
}

export function logicalRow(idx: number): number {
  return Math.floor(idx / COLS);
}

export function column(idx: number): number {
  return idx % COLS;
}

/** Vertical scroll offset (px) that brings the most recently planted row into view. */
export function scrollTargetPx(treeCount: number, containerHeight: number): number {
  const ch = canvasHeightPx(treeCount);
  const curRow = Math.max(0, Math.floor((treeCount - 1) / COLS));
  const groundFromTop = ch - (BOT_PAD + curRow * ROW_H);
  const target = groundFromTop - containerHeight * 0.7;
  return Math.max(0, target);
}
