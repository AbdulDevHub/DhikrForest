import type { ForestSegment, TreeType } from '../types';
import { QADR_MULTIPLIER, TREES_PER_PAGE } from '../utils/constants';

/**
 * The forest is stored run-length encoded: consecutive trees of the same type
 * collapse into one `{ t, n }` segment. A million standard trees is one tiny
 * object instead of a million, so saving stays instant and never hits the
 * localStorage quota.
 */

export function appendTrees(segments: ForestSegment[], type: TreeType, n: number): ForestSegment[] {
  if (n <= 0) return segments;
  const last = segments[segments.length - 1];
  if (last && last.t === type) {
    return [...segments.slice(0, -1), { t: type, n: last.n + n }];
  }
  return [...segments, { t: type, n }];
}

/** Number of tree slots (each Qadr tree occupies one slot). */
export function treeCount(segments: ForestSegment[]): number {
  let count = 0;
  for (const s of segments) count += s.n;
  return count;
}

/** Trees "in Jannah": a Qadr tree is worth QADR_MULTIPLIER standard trees. */
export function totalValue(segments: ForestSegment[]): number {
  let total = 0;
  for (const s of segments) total += s.t === 'qadr' ? s.n * QADR_MULTIPLIER : s.n;
  return total;
}

/** Tree types for one page of the forest, in planting order. */
export function pageItems(segments: ForestSegment[], page: number): TreeType[] {
  const start = page * TREES_PER_PAGE;
  const end = start + TREES_PER_PAGE;
  const out: TreeType[] = [];
  let offset = 0;
  for (const s of segments) {
    const segEnd = offset + s.n;
    if (segEnd > start) {
      const from = Math.max(start, offset);
      const to = Math.min(end, segEnd);
      for (let i = from; i < to; i++) out.push(s.t);
    }
    offset = segEnd;
    if (offset >= end) break;
  }
  return out;
}

export function isValidSegments(value: unknown): value is ForestSegment[] {
  return (
    Array.isArray(value) &&
    value.every(
      (s) =>
        s &&
        (s.t === 'standard' || s.t === 'qadr') &&
        Number.isSafeInteger(s.n) &&
        s.n > 0
    )
  );
}
