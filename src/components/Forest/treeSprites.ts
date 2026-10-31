import { PALETTES } from '../../utils/constants';
import type { TreePalette } from '../../types';

/**
 * Pine trees pre-drawn once into small offscreen canvases. The forest then
 * just stamps these images, so a full page of 1,000 trees renders in a couple
 * of milliseconds instead of thousands of DOM nodes with CSS filters.
 */

export const SPRITE_W = 128;
export const SPRITE_H = 192;
/** Distance from the sprite's bottom edge to the trunk base. */
export const SPRITE_BASE_PAD = 12;

const QADR_PALETTES: TreePalette[] = [
  { top: '#fde68a', mid: '#f59e0b', bot: '#b45309' },
  { top: '#fef08a', mid: '#facc15', bot: '#ca8a04' },
];

function drawPine(ctx: CanvasRenderingContext2D, p: TreePalette, layers: number, widthFactor: number, qadr: boolean) {
  const cx = SPRITE_W / 2;
  const baseY = SPRITE_H - SPRITE_BASE_PAD;
  const trunkW = SPRITE_W * 0.1;
  const trunkH = SPRITE_H * 0.15;
  const layerH = SPRITE_H * 0.3;
  const step = layerH * 0.5;
  const maxW = SPRITE_W * 0.86 * widthFactor;

  if (qadr) {
    const glow = ctx.createRadialGradient(cx, baseY - SPRITE_H * 0.4, 4, cx, baseY - SPRITE_H * 0.4, SPRITE_W * 0.55);
    glow.addColorStop(0, 'rgba(253, 230, 138, 0.55)');
    glow.addColorStop(1, 'rgba(253, 230, 138, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, SPRITE_W, SPRITE_H);
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 30, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(cx + 6, baseY, maxW * 0.42, SPRITE_H * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  const bark = ctx.createLinearGradient(cx - trunkW / 2, 0, cx + trunkW / 2, 0);
  bark.addColorStop(0, '#3e2610');
  bark.addColorStop(0.5, '#7a4a1f');
  bark.addColorStop(1, '#3e2610');
  ctx.fillStyle = bark;
  ctx.fillRect(cx - trunkW / 2, baseY - trunkH, trunkW, trunkH);

  const colors = [p.bot, p.mid, p.top, p.top];
  for (let i = 0; i < layers; i++) {
    const w = maxW * (1 - i * (0.62 / layers));
    const bottom = baseY - trunkH * 0.6 - i * step;
    const top = bottom - layerH;

    // Shadow cast onto the layer below
    if (i > 0) {
      ctx.fillStyle = 'rgba(0, 20, 0, 0.22)';
      ctx.beginPath();
      ctx.moveTo(cx - w / 2 + 2, bottom + 5);
      ctx.lineTo(cx + w / 2 + 2, bottom + 5);
      ctx.lineTo(cx + 2, top + 5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = colors[Math.min(i, colors.length - 1)];
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, bottom);
    ctx.lineTo(cx + w / 2, bottom);
    ctx.lineTo(cx, top);
    ctx.closePath();
    ctx.fill();

    // Lit left side, shaded right side
    ctx.fillStyle = 'rgba(255, 255, 255, 0.13)';
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, bottom);
    ctx.lineTo(cx, bottom);
    ctx.lineTo(cx, top);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.moveTo(cx, bottom);
    ctx.lineTo(cx + w / 2, bottom);
    ctx.lineTo(cx, top);
    ctx.closePath();
    ctx.fill();
  }

  if (qadr) {
    ctx.fillStyle = '#ffffff';
    for (const [x, y, r] of [
      [0.36, 0.42, 3],
      [0.64, 0.55, 3.5],
      [0.5, 0.3, 2.5],
      [0.42, 0.68, 2],
    ]) {
      ctx.beginPath();
      ctx.arc(SPRITE_W * x, SPRITE_H * y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function makeSprite(p: TreePalette, layers: number, widthFactor: number, qadr: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SPRITE_W;
  c.height = SPRITE_H;
  const ctx = c.getContext('2d');
  if (ctx) drawPine(ctx, p, layers, widthFactor, qadr);
  return c;
}

let cache: { standard: HTMLCanvasElement[]; qadr: HTMLCanvasElement[] } | null = null;

export function getTreeSprites() {
  if (!cache) {
    const standard: HTMLCanvasElement[] = [];
    for (const p of PALETTES) {
      for (const layers of [3, 4]) {
        for (const wf of [0.82, 1]) standard.push(makeSprite(p, layers, wf, false));
      }
    }
    const qadr = QADR_PALETTES.flatMap((p) => [makeSprite(p, 4, 1, true), makeSprite(p, 3, 0.9, true)]);
    cache = { standard, qadr };
  }
  return cache;
}

/** Faint grass blades, tiled over the ground under the trees. */
export function makeGrassPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const size = 96;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const t = tile.getContext('2d');
  if (!t) return null;
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 70; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const h = 3 + rand() * 5;
    t.strokeStyle = rand() > 0.5 ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 40, 0, 0.12)';
    t.lineWidth = 1;
    t.beginPath();
    t.moveTo(x, y);
    t.lineTo(x + (rand() - 0.5) * 3, y - h);
    t.stroke();
  }
  return ctx.createPattern(tile, 'repeat');
}
