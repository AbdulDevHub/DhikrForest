import type { EffectiveTimeOfDay, TreeType } from '../../types';

/**
 * Hand-painted tree sprites, drawn once with canvas paths and cached.
 * The forest only stamps these images, so 1,000 trees stay cheap to draw.
 * Sprites are colour-graded per time of day (dawn / day / night / Qadr).
 */

export type Mode = EffectiveTimeOfDay;
export type Rand = () => number;

export const SPRITE_W = 160;
export const SPRITE_H = 210;
/** y of the trunk base inside a sprite. */
export const SPRITE_BASE = SPRITE_H - 10;

/** Small, fast seeded PRNG (mulberry32). */
export function rng(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

interface Greens {
  dark: string;
  mid: string;
  light: string;
}

const GREENS: Greens[] = [
  { dark: '#064e3b', mid: '#059669', light: '#6ee7b7' },
  { dark: '#14532d', mid: '#16a34a', light: '#86efac' },
  { dark: '#365314', mid: '#65a30d', light: '#bef264' },
  { dark: '#134e4a', mid: '#0f9488', light: '#5eead4' },
  { dark: '#1a3d1f', mid: '#2f7d3a', light: '#9ae6a4' },
];
const GOLD: Greens = { dark: '#a16207', mid: '#eab308', light: '#fef08a' };

const W = SPRITE_W;
const H = SPRITE_H;
const BASE = SPRITE_BASE;
const CX = W / 2;

/** Circles scattered inside an ellipse: the basic brush for foliage. */
function blob(ctx: CanvasRenderingContext2D, r: Rand, cx: number, cy: number, rx: number, ry: number, n: number, rMin: number, rMax: number, color: string | string[]) {
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    ctx.fillStyle = Array.isArray(color) ? color[Math.floor(r() * color.length)] : color;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rMin + (rMax - rMin) * r(), 0, Math.PI * 2);
    ctx.fill();
  }
}

function trunk(ctx: CanvasRenderingContext2D, baseY: number, topY: number, wBottom: number, wTop: number, xTop = CX) {
  const g = ctx.createLinearGradient(CX - wBottom / 2, 0, CX + wBottom / 2, 0);
  g.addColorStop(0, '#3b2412');
  g.addColorStop(0.4, '#80552f');
  g.addColorStop(1, '#2a180b');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(CX - wBottom / 2 - 3, baseY);
  ctx.quadraticCurveTo(CX - wBottom / 2, baseY - 6, CX - wBottom / 2, baseY - 10);
  ctx.quadraticCurveTo(CX - wTop / 2 - 1, (baseY + topY) / 2, xTop - wTop / 2, topY);
  ctx.lineTo(xTop + wTop / 2, topY);
  ctx.quadraticCurveTo(CX + wTop / 2 + 1, (baseY + topY) / 2, CX + wBottom / 2, baseY - 10);
  ctx.quadraticCurveTo(CX + wBottom / 2, baseY - 6, CX + wBottom / 2 + 3, baseY);
  ctx.closePath();
  ctx.fill();
}

/** Light from the upper left: warm highlight there, cool shade bottom right. */
function shade(ctx: CanvasRenderingContext2D, strength = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(W * 0.15, H * 0.1, W * 0.9, H * 0.9);
  g.addColorStop(0, `rgba(255, 250, 210, ${0.14 * strength})`);
  g.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, `rgba(0, 25, 20, ${0.42 * strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

interface Canopy {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

function broadleaf(ctx: CanvasRenderingContext2D, r: Rand, p: Greens): Canopy {
  trunk(ctx, BASE, BASE - H * 0.42, W * 0.09, W * 0.05);
  ctx.strokeStyle = '#4a2f17';
  ctx.lineCap = 'round';
  ctx.lineWidth = W * 0.024;
  ctx.beginPath();
  ctx.moveTo(CX, BASE - H * 0.28);
  ctx.quadraticCurveTo(CX - W * 0.08, BASE - H * 0.38, CX - W * 0.17, BASE - H * 0.47);
  ctx.moveTo(CX, BASE - H * 0.33);
  ctx.quadraticCurveTo(CX + W * 0.07, BASE - H * 0.41, CX + W * 0.16, BASE - H * 0.5);
  ctx.stroke();

  const c = { cx: CX, cy: BASE - H * 0.6, rx: W * 0.3, ry: H * 0.2 };
  blob(ctx, r, c.cx + W * 0.02, c.cy + H * 0.03, c.rx, c.ry, 18, W * 0.1, W * 0.15, p.dark);
  blob(ctx, r, c.cx - W * 0.01, c.cy - H * 0.005, c.rx * 0.86, c.ry * 0.82, 15, W * 0.085, W * 0.13, p.mid);
  blob(ctx, r, c.cx - W * 0.07, c.cy - H * 0.06, c.rx * 0.52, c.ry * 0.46, 10, W * 0.045, W * 0.085, p.light);
  ctx.globalAlpha = 0.5;
  blob(ctx, r, c.cx - W * 0.03, c.cy - H * 0.02, c.rx * 0.85, c.ry * 0.8, 34, 1.2, 2.8, p.light);
  ctx.globalAlpha = 1;
  return c;
}

/** Shiny round dots (fruit, blossoms, lights) with a tiny highlight. */
function baubles(ctx: CanvasRenderingContext2D, r: Rand, c: Canopy, n: number, rMin: number, rMax: number, colors: string[], highlight: boolean) {
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.92;
    const x = c.cx + Math.cos(a) * c.rx * d;
    const y = c.cy + Math.sin(a) * c.ry * d + H * 0.01;
    const rad = rMin + (rMax - rMin) * r();
    ctx.fillStyle = colors[Math.floor(r() * colors.length)];
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
    if (highlight) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(x - rad * 0.35, y - rad * 0.35, rad * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function blossom(ctx: CanvasRenderingContext2D, r: Rand, p: Greens, petals: string[]) {
  const c = broadleaf(ctx, r, p);
  baubles(ctx, r, c, 40, 1.8, 3.2, petals, false);
  ctx.globalAlpha = 0.55;
  baubles(ctx, r, { ...c, cy: c.cy - H * 0.03, rx: c.rx * 0.6, ry: c.ry * 0.5 }, 10, 1.2, 2.2, ['#ffffff'], false);
  ctx.globalAlpha = 1;
}

function fruit(ctx: CanvasRenderingContext2D, r: Rand, p: Greens, colors: string[]) {
  const c = broadleaf(ctx, r, p);
  baubles(ctx, r, c, 15, 3.4, 4.8, colors, true);
}

function palm(ctx: CanvasRenderingContext2D, r: Rand, p: Greens) {
  const lean = r() < 0.5 ? -1 : 1;
  const top = { x: CX + lean * W * 0.1, y: BASE - H * 0.6 };
  const ctrl = { x: CX + lean * W * 0.2, y: BASE - H * 0.3 };
  const at = (t: number) => ({
    x: (1 - t) * (1 - t) * CX + 2 * (1 - t) * t * ctrl.x + t * t * top.x,
    y: (1 - t) * (1 - t) * BASE + 2 * (1 - t) * t * ctrl.y + t * t * top.y,
  });

  // Ringed trunk
  const N = 16;
  ctx.lineCap = 'butt';
  for (let i = 0; i < N; i++) {
    const a = at(i / N);
    const b = at((i + 1) / N);
    ctx.strokeStyle = i % 2 ? '#7a4f27' : '#946238';
    ctx.lineWidth = W * (0.075 - 0.028 * (i / N));
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 230, 190, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = at(i / N);
    ctx.lineTo(a.x - W * 0.02, a.y);
  }
  ctx.stroke();

  // Dates hanging under the crown
  blob(ctx, r, top.x, top.y + H * 0.045, W * 0.06, H * 0.03, 14, 2.4, 3.6, ['#92400e', '#b45309', '#d97706']);

  // Fronds: a drooping spine with leaflets on both sides
  const fronds = 10;
  ctx.lineCap = 'round';
  for (let k = 0; k < fronds; k++) {
    const a = -Math.PI + ((k + 0.5) / fronds) * Math.PI + (r() - 0.5) * 0.3;
    const len = W * (0.3 + r() * 0.08);
    const droop = 0.55 + r() * 0.35;
    const P = (t: number) => ({
      x: top.x + Math.cos(a) * len * t,
      y: top.y + Math.sin(a) * len * t + droop * len * t * t,
    });
    for (let t = 0.1; t <= 1; t += 0.045) {
      const p0 = P(t);
      const p1 = P(t + 0.02);
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const m = Math.hypot(dx, dy) || 1;
      const leafLen = W * 0.13 * (1 - t * 0.6);
      for (const side of [-1, 1]) {
        const ang = Math.atan2(dy, dx) + side * 1.1;
        ctx.strokeStyle = side < 0 ? p.mid : p.dark;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p0.x + Math.cos(ang) * leafLen + (dx / m) * 2, p0.y + Math.sin(ang) * leafLen + leafLen * 0.35);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.05) {
      const q = P(t);
      if (t === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();
  }
  // Sunlit tips on the upper fronds
  ctx.globalAlpha = 0.55;
  blob(ctx, r, top.x - W * 0.05, top.y - H * 0.06, W * 0.2, H * 0.07, 20, 1.4, 2.6, p.light);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.arc(top.x, top.y, W * 0.03, 0, Math.PI * 2);
  ctx.fill();
}

function cypress(ctx: CanvasRenderingContext2D, r: Rand, p: Greens) {
  trunk(ctx, BASE, BASE - H * 0.12, W * 0.06, W * 0.045);
  const top = BASE - H * 0.93;
  const bot = BASE - H * 0.07;
  const hw = W * 0.15;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX, top);
  ctx.bezierCurveTo(CX + hw * 0.6, top + H * 0.15, CX + hw * 1.2, bot - H * 0.35, CX + hw * 0.55, bot);
  ctx.quadraticCurveTo(CX, bot + H * 0.035, CX - hw * 0.55, bot);
  ctx.bezierCurveTo(CX - hw * 1.2, bot - H * 0.35, CX - hw * 0.6, top + H * 0.15, CX, top);
  ctx.closePath();
  const g = ctx.createLinearGradient(CX - hw, 0, CX + hw, 0);
  g.addColorStop(0, p.light);
  g.addColorStop(0.35, p.mid);
  g.addColorStop(1, p.dark);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  // Scale-like foliage texture
  for (let i = 0; i < 70; i++) {
    const y = top + r() * (bot - top);
    const x = CX + (r() - 0.5) * hw * 2;
    ctx.fillStyle = r() < 0.5 ? 'rgba(0, 30, 20, 0.22)' : 'rgba(220, 255, 220, 0.14)';
    ctx.beginPath();
    ctx.ellipse(x, y, W * 0.035, H * 0.018, (r() - 0.5) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function fir(ctx: CanvasRenderingContext2D, r: Rand, p: Greens) {
  trunk(ctx, BASE, BASE - H * 0.2, W * 0.07, W * 0.05);
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const bottom = BASE - H * 0.12 - i * H * 0.15;
    const tierTop = bottom - H * 0.27;
    const hw = W * 0.38 * (1 - i * 0.16);
    const teeth = 7;
    ctx.beginPath();
    ctx.moveTo(CX, tierTop);
    ctx.lineTo(CX + hw, bottom);
    for (let t = teeth; t >= 0; t--) {
      const x = CX - hw + (2 * hw * t) / teeth;
      ctx.lineTo(x, bottom + (t % 2 ? -H * 0.02 : H * 0.012) * (r() * 0.6 + 0.7));
    }
    ctx.closePath();
    ctx.fillStyle = p.dark;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = p.mid;
    ctx.beginPath();
    ctx.moveTo(CX, tierTop);
    ctx.lineTo(CX - hw * 1.1, bottom + 4);
    ctx.lineTo(CX + hw * 0.1, bottom + 4);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.45;
    blob(ctx, r, CX - hw * 0.35, bottom - H * 0.08, hw * 0.45, H * 0.06, 10, 1.2, 2.4, p.light);
    ctx.restore();
  }
}

function lightTree(ctx: CanvasRenderingContext2D, r: Rand) {
  const c = broadleaf(ctx, r, GOLD);
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createRadialGradient(c.cx - W * 0.03, c.cy - H * 0.03, 2, c.cx, c.cy, c.rx * 1.4);
  g.addColorStop(0, 'rgba(255, 255, 240, 0.5)');
  g.addColorStop(0.45, 'rgba(255, 236, 160, 0.18)');
  g.addColorStop(1, 'rgba(255, 220, 120, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  for (let i = 0; i < 22; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.95;
    const x = c.cx + Math.cos(a) * c.rx * d;
    const y = c.cy + Math.sin(a) * c.ry * d;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = r() < 0.5 ? '#ffffff' : '#fff7c2';
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

type Painter = (ctx: CanvasRenderingContext2D, r: Rand) => void;

const SPECIES: { weight: number; variants: Painter[] }[] = [
  { weight: 0.27, variants: GREENS.map((g) => (ctx, r) => broadleaf(ctx, r, g)) },
  { weight: 0.18, variants: [GREENS[0], GREENS[2], GREENS[1]].map((g) => (ctx, r) => palm(ctx, r, g)) },
  {
    weight: 0.14,
    variants: [
      (ctx, r) => blossom(ctx, r, GREENS[1], ['#f9a8d4', '#f472b6', '#fbcfe8']),
      (ctx, r) => blossom(ctx, r, GREENS[3], ['#fce7f3', '#fbcfe8', '#f5d0fe']),
      (ctx, r) => blossom(ctx, r, GREENS[4], ['#c4b5fd', '#ddd6fe', '#a78bfa']),
    ],
  },
  {
    weight: 0.16,
    variants: [
      (ctx, r) => fruit(ctx, r, GREENS[0], ['#fbbf24', '#f59e0b']),
      (ctx, r) => fruit(ctx, r, GREENS[1], ['#be123c', '#e11d48', '#9f1239']),
      (ctx, r) => fruit(ctx, r, GREENS[2], ['#fb923c', '#f97316']),
    ],
  },
  { weight: 0.12, variants: [GREENS[4], GREENS[0]].map((g) => (ctx, r) => cypress(ctx, r, g)) },
  { weight: 0.13, variants: [GREENS[0], GREENS[3]].map((g) => (ctx, r) => fir(ctx, r, g)) },
];
const FLAT: Painter[] = SPECIES.flatMap((s) => s.variants);
const QADR_PAINTERS: Painter[] = [lightTree, lightTree];

/** Which sprite a tree uses: picked by species weight, stable for its global index. */
export function spriteIndexFor(globalIdx: number): number {
  const r = rng(globalIdx * 2654435761 + 97);
  let roll = r();
  let offset = 0;
  for (const s of SPECIES) {
    if (roll < s.weight) return offset + Math.floor(r() * s.variants.length);
    roll -= s.weight;
    offset += s.variants.length;
  }
  return Math.floor(r() * FLAT.length);
}

const GRADE: Record<Mode, { multiply: string | null; screen: string | null }> = {
  morning: { multiply: '#ffeadf', screen: 'rgba(255, 170, 110, 0.10)' },
  afternoon: { multiply: null, screen: 'rgba(255, 250, 225, 0.05)' },
  night: { multiply: '#55649e', screen: null },
  qadr: { multiply: '#5f5ca4', screen: 'rgba(255, 215, 130, 0.05)' },
};

/** Recolours a canvas for the time of day, keeping its transparency. */
export function gradeCanvas(c: HTMLCanvasElement, mode: Mode, gentle = false) {
  const g = GRADE[mode];
  const ctx = c.getContext('2d');
  if (!ctx || (!g.multiply && !g.screen)) return;
  const mask = makeCanvas(c.width, c.height);
  mask.getContext('2d')?.drawImage(c, 0, 0);
  ctx.save();
  if (g.multiply) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = gentle ? 0.6 : 1;
    ctx.fillStyle = g.multiply;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalAlpha = 1;
  }
  if (g.screen) {
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g.screen;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0);
  ctx.restore();
}

function paint(painter: Painter, seed: number, mode: Mode, qadr: boolean): HTMLCanvasElement {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  if (ctx) {
    painter(ctx, rng(seed));
    shade(ctx, qadr ? 0.4 : 1);
    gradeCanvas(c, mode, qadr);
  }
  return c;
}

const spriteCache = new Map<Mode, { standard: HTMLCanvasElement[]; qadr: HTMLCanvasElement[] }>();

export function getSprites(mode: Mode) {
  let s = spriteCache.get(mode);
  if (!s) {
    s = {
      standard: FLAT.map((p, i) => paint(p, 1000 + i * 31, mode, false)),
      qadr: QADR_PAINTERS.map((p, i) => paint(p, 5000 + i * 31, mode, true)),
    };
    spriteCache.set(mode, s);
  }
  return s;
}

export function spriteFor(sprites: ReturnType<typeof getSprites>, type: TreeType, globalIdx: number) {
  if (type === 'qadr') return sprites.qadr[globalIdx % sprites.qadr.length];
  return sprites.standard[spriteIndexFor(globalIdx) % sprites.standard.length];
}

const glowCache = new Map<string, HTMLCanvasElement>();

/** Soft round light, drawn with 'lighter' for fireflies, orbs and halos. */
export function glow(r: number, g: number, b: number): HTMLCanvasElement {
  const key = `${r},${g},${b}`;
  let c = glowCache.get(key);
  if (!c) {
    c = makeCanvas(64, 64);
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
      grad.addColorStop(0.18, `rgba(${r}, ${g}, ${b}, 0.55)`);
      grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.12)`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    glowCache.set(key, c);
  }
  return c;
}
