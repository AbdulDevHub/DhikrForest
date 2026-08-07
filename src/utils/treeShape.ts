import { PALETTES } from './constants';
import { pr } from './prng';

export interface TreeLayer {
  widthPx: number;
  heightPx: number;
  color: string;
  shadowPx: number;
  marginBottomPx: number;
}

export interface TreeShape {
  scale: number;
  trunkWidthPx: number;
  trunkHeightPx: number;
  layers: TreeLayer[];
}

/** Deterministic tree appearance derived purely from its index. */
export function buildTreeShape(idx: number, scale: number): TreeShape {
  const s = idx * 37 + 3;
  const p = PALETTES[Math.floor(pr(s) * PALETTES.length)];
  const layerCount = 3 + (pr(s + 1) > 0.5 ? 1 : 0);
  const baseW = Math.round((42 + pr(s + 2) * 24) * scale);
  const layerH = Math.round((24 + pr(s + 3) * 10) * scale);
  const overlap = Math.round(7 * scale);
  const trunkWidthPx = Math.round((7 + pr(s + 4) * 4) * scale);
  const trunkHeightPx = Math.round((16 + pr(s + 5) * 14) * scale);
  const cols = [p.top, p.mid, p.bot, p.bot];

  const layers: TreeLayer[] = [];
  for (let i = 0; i < layerCount; i++) {
    const w = Math.max(6, baseW - i * Math.round(9 * scale));
    layers.push({
      widthPx: w,
      heightPx: layerH,
      color: cols[Math.min(i, cols.length - 1)],
      shadowPx: Math.round(2 * scale),
      marginBottomPx: -overlap,
    });
  }

  return { scale, trunkWidthPx, trunkHeightPx, layers };
}
