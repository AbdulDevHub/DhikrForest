import { GRID_COLS, GRID_ROWS } from '../../utils/constants';
import type { Mode, Rand } from './forestArt';
import { gradeCanvas, makeCanvas, rng } from './forestArt';

/**
 * The garden landscape: a ground plane seen in perspective, a river that
 * winds from a palace on the horizon toward the viewer, and a sky that
 * follows the time of day. Everything here is painted once per
 * size / mode / page and cached; trees are stamped on top.
 */

export interface Geom {
  w: number;
  h: number;
  horizon: number;
  frontY: number;
  cx: number;
  /** Display height of a tree in the front row. */
  treeH: number;
}

export function makeGeom(w: number, h: number): Geom {
  const narrow = w < 640;
  return {
    w,
    h,
    horizon: h * (narrow ? 0.25 : 0.22),
    frontY: h * 1.01,
    cx: w / 2,
    treeH: Math.min(h * (narrow ? 0.2 : 0.17), w * (narrow ? 0.16 : 0.105)),
  };
}

// Depth: z = 1 is the front row, larger z is further away. World x unit = half the screen width at z = 1.
export const screenY = (g: Geom, z: number) => g.horizon + (g.frontY - g.horizon) / z;
export const screenX = (g: Geom, xw: number, z: number) => g.cx + (xw * (g.w / 2)) / z;
/** Trees shrink a little slower than true perspective, so the back rows still read as a forest. */
export const treeScale = (z: number) => Math.pow(1 / z, 0.62);

export interface River {
  phase: number;
  phase2: number;
  halfW: number;
}

export function riverFor(page: number): River {
  const r = rng(page * 7919 + 17);
  return { phase: r() * Math.PI * 2, phase2: r() * Math.PI * 2, halfW: 0.075 };
}

/** River centre in world x at depth z (meanders evenly on screen at every depth). */
export function riverX(rv: River, z: number): number {
  const u = Math.log(z);
  return z * (0.16 * Math.sin(u * 2.2 + rv.phase) + 0.045 * Math.sin(u * 5 + rv.phase2));
}

const DEPTH = 4.2;
const DEPTH_CURVE = 1.12;
/** Depth of the planted field at fraction d (0 = front row, 1 = back row). */
const fieldZ = (d: number) => 1 + DEPTH * Math.pow(d, DEPTH_CURVE);
const fieldCoverage = (d: number) => 1.07 - 0.5 * d;
/** Half-width (world x) of the planted field at depth z, or 0 beyond its back row. */
function fieldHalfAt(z: number): number {
  if (z > fieldZ(1)) return 0;
  const d = Math.pow(Math.max(0, z - 1) / DEPTH, 1 / DEPTH_CURVE);
  return fieldCoverage(d) * z;
}

export interface Slot {
  x: number;
  y: number;
  z: number;
  /** Display height of the tree. */
  size: number;
}

/**
 * Where each of a page's 1,000 trees stands. Planting starts at the front
 * row and, within a row, lines the riverbanks first, then spreads outward.
 */
export function layoutPage(g: Geom, rv: River, page: number): Slot[] {
  const slots: Slot[] = [];
  const perSide = GRID_COLS / 2;
  for (let i = 0; i < GRID_COLS * GRID_ROWS; i++) {
    const r = rng(page * 100003 + i * 7 + 1);
    const row = Math.floor(i / GRID_COLS);
    const k = i % GRID_COLS;
    const side = k % 2 === 0 ? -1 : 1;
    const j = Math.floor(k / 2);
    const d = (row + 0.5 + (r() - 0.5) * 0.7) / GRID_ROWS;
    const z = fieldZ(Math.max(0, d));
    const fieldHalf = fieldCoverage(d) * z;
    const size = g.treeH * treeScale(z) * (0.85 + r() * 0.3);
    const worldW = ((size * 0.75) / (g.w / 2)) * z;
    const xc = riverX(rv, z);
    const bank = xc + side * (rv.halfW * 1.25 + worldW * 0.3);
    const edge = side * fieldHalf;
    const span = Math.max(0.1 * z, Math.abs(edge - bank));
    const t = (j + 0.5 + (r() - 0.5) * 0.85) / perSide;
    const xw = bank + side * span * t;
    slots.push({ x: screenX(g, xw, z), y: screenY(g, z), z, size });
  }
  return slots;
}

// ── Sky ──────────────────────────────────────────────────────────────

const SKY: Record<Mode, string[]> = {
  morning: ['#1d2156', '#4f3d7c', '#b8678f', '#f29f7f', '#ffd9a3'],
  afternoon: ['#2a78cc', '#4597dd', '#7fbdec', '#bfe3f7', '#e4f5fb'],
  night: ['#02060f', '#08122b', '#11224a', '#1c3160', '#28406f'],
  qadr: ['#03020c', '#0f0a2e', '#1f1752', '#382a6b', '#5a427f'],
};
const HILLS: Record<Mode, [string, string]> = {
  morning: ['#9a78a6', '#73608d'],
  afternoon: ['#9ccbb8', '#76b392'],
  night: ['#1b2849', '#141f3b'],
  qadr: ['#2b2258', '#211a47'],
};
export const HAZE: Record<Mode, [number, number, number]> = {
  morning: [255, 214, 196],
  afternoon: [222, 241, 255],
  night: [38, 52, 92],
  qadr: [86, 66, 138],
};

function stars(ctx: CanvasRenderingContext2D, r: Rand, g: Geom, n: number) {
  for (let i = 0; i < n; i++) {
    const x = r() * g.w;
    const y = Math.pow(r(), 1.3) * g.horizon * 0.95;
    const s = 0.3 + Math.pow(r(), 3) * 1.4;
    ctx.fillStyle = `rgba(255, 255, ${220 + Math.floor(r() * 35)}, ${0.35 + r() * 0.65})`;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function cloud(ctx: CanvasRenderingContext2D, r: Rand, x: number, y: number, s: number, light: string, shadow: string) {
  ctx.fillStyle = shadow;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(x + (r() - 0.5) * 70 * s, y + 6 * s, (22 + r() * 22) * s, (8 + r() * 5) * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = light;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.ellipse(x + (r() - 0.5) * 80 * s, y - r() * 8 * s, (16 + r() * 22) * s, (9 + r() * 8) * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function moon(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, crescent: boolean) {
  const halo = ctx.createRadialGradient(x, y, rad * 0.5, x, y, rad * 7);
  halo.addColorStop(0, 'rgba(255, 244, 210, 0.35)');
  halo.addColorStop(1, 'rgba(255, 244, 210, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - rad * 7, y - rad * 7, rad * 14, rad * 14);
  const c = makeCanvas(rad * 2 + 4, rad * 2 + 4);
  const m = c.getContext('2d');
  if (!m) return;
  const disk = m.createRadialGradient(rad * 0.8, rad * 0.8, rad * 0.1, rad + 2, rad + 2, rad);
  disk.addColorStop(0, '#fffbea');
  disk.addColorStop(1, '#f3dc9a');
  m.fillStyle = disk;
  m.beginPath();
  m.arc(rad + 2, rad + 2, rad, 0, Math.PI * 2);
  m.fill();
  if (crescent) {
    m.globalCompositeOperation = 'destination-out';
    m.beginPath();
    m.arc(rad + 2 + rad * 0.5, rad + 2 - rad * 0.22, rad * 0.92, 0, Math.PI * 2);
    m.fill();
  }
  ctx.drawImage(c, x - rad - 2, y - rad - 2);
}

function hillPath(ctx: CanvasRenderingContext2D, g: Geom, r: Rand, height: number, dipX: number, dipW: number) {
  const p = [r() * 6, r() * 6, r() * 6];
  ctx.beginPath();
  ctx.moveTo(0, g.horizon + 2);
  for (let x = 0; x <= g.w + 4; x += 4) {
    const u = x / g.w;
    const n = 0.55 + 0.25 * Math.sin(u * 5.3 + p[0]) + 0.14 * Math.sin(u * 13 + p[1]) + 0.06 * Math.sin(u * 31 + p[2]);
    const dip = Math.min(1, Math.abs(x - dipX) / dipW);
    ctx.lineTo(x, g.horizon - height * n * (0.35 + 0.65 * dip * dip));
  }
  ctx.lineTo(g.w, g.horizon + 2);
  ctx.closePath();
  ctx.fill();
}

/** A distant palace of domes and slender towers where the river begins. */
function palace(ctx: CanvasRenderingContext2D, x: number, baseY: number, height: number, mode: Mode) {
  const u = height / 10;
  const night = mode === 'night' || mode === 'qadr';
  const wall = { morning: '#ffe2c6', afternoon: '#fff8e8', night: '#2f3a5e', qadr: '#3e3570' }[mode];
  const wallShade = { morning: '#e7b99a', afternoon: '#e9dcbc', night: '#232c4a', qadr: '#2f285a' }[mode];
  const dome = { morning: '#f6b85c', afternoon: '#f2c45a', night: '#55608a', qadr: '#e0b04a' }[mode];
  const windowCol = night ? '#ffd773' : mode === 'morning' ? '#8a5a5a' : '#8d7b5c';

  const glowAt = (wx: number, wy: number, rad: number) => {
    if (!night) return;
    const gl = ctx.createRadialGradient(wx, wy, 0, wx, wy, rad);
    gl.addColorStop(0, 'rgba(255, 214, 120, 0.55)');
    gl.addColorStop(1, 'rgba(255, 214, 120, 0)');
    ctx.fillStyle = gl;
    ctx.fillRect(wx - rad, wy - rad, rad * 2, rad * 2);
  };

  if (night) glowAt(x, baseY - 4 * u, 14 * u);

  const onion = (cx: number, by: number, rad: number, tall: number) => {
    const grad = ctx.createLinearGradient(cx - rad, 0, cx + rad, 0);
    grad.addColorStop(0, dome);
    grad.addColorStop(1, wallShade);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - rad * 0.85, by);
    ctx.bezierCurveTo(cx - rad * 1.25, by - tall * 0.45, cx - rad * 0.35, by - tall * 0.75, cx, by - tall);
    ctx.bezierCurveTo(cx + rad * 0.35, by - tall * 0.75, cx + rad * 1.25, by - tall * 0.45, cx + rad * 0.85, by);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = dome;
    ctx.lineWidth = Math.max(0.6, u * 0.12);
    ctx.beginPath();
    ctx.moveTo(cx, by - tall);
    ctx.lineTo(cx, by - tall - u * 0.7);
    ctx.stroke();
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.arc(cx, by - tall - u * 0.2, u * 0.16, 0, Math.PI * 2);
    ctx.fill();
  };

  const tower = (tx: number) => {
    ctx.fillStyle = wall;
    ctx.fillRect(tx - u * 0.45, baseY - 8.2 * u, u * 0.9, 8.2 * u);
    ctx.fillStyle = wallShade;
    ctx.fillRect(tx, baseY - 8.2 * u, u * 0.45, 8.2 * u);
    ctx.fillRect(tx - u * 0.7, baseY - 6.2 * u, u * 1.4, u * 0.3);
    onion(tx, baseY - 8.2 * u, u * 0.6, u * 1.4);
  };

  tower(x - 7.2 * u);
  tower(x + 7.2 * u);

  // Hall with arches
  ctx.fillStyle = wall;
  ctx.fillRect(x - 5.5 * u, baseY - 3.4 * u, 11 * u, 3.4 * u);
  ctx.fillStyle = wallShade;
  ctx.fillRect(x + 1.5 * u, baseY - 3.4 * u, 4 * u, 3.4 * u);
  ctx.fillStyle = windowCol;
  for (let i = -2; i <= 2; i++) {
    const ax = x + i * 2 * u;
    ctx.beginPath();
    ctx.moveTo(ax - 0.55 * u, baseY - 0.2 * u);
    ctx.lineTo(ax - 0.55 * u, baseY - 1.9 * u);
    ctx.quadraticCurveTo(ax, baseY - 2.9 * u, ax + 0.55 * u, baseY - 1.9 * u);
    ctx.lineTo(ax + 0.55 * u, baseY - 0.2 * u);
    ctx.closePath();
    ctx.fill();
  }

  // Side domes, drum and main dome
  onion(x - 3.7 * u, baseY - 3.4 * u, u * 1.1, u * 1.9);
  onion(x + 3.7 * u, baseY - 3.4 * u, u * 1.1, u * 1.9);
  ctx.fillStyle = wall;
  ctx.fillRect(x - 2.2 * u, baseY - 4.5 * u, 4.4 * u, 1.1 * u);
  onion(x, baseY - 4.5 * u, u * 2.6, u * 4.4);

  if (night) {
    for (let i = -2; i <= 2; i++) glowAt(x + i * 2 * u, baseY - 1.4 * u, 1.6 * u);
  }
}

function paintSky(ctx: CanvasRenderingContext2D, g: Geom, mode: Mode, rv: River, page: number) {
  const r = rng(page * 31 + 7);
  const cols = SKY[mode];
  const grad = ctx.createLinearGradient(0, 0, 0, g.horizon + 4);
  cols.forEach((c, i) => grad.addColorStop(i / (cols.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, g.w, g.horizon + 6);
  const unit = Math.max(0.55, Math.min(1.4, g.w / 1100));

  if (mode === 'afternoon') {
    const sun = ctx.createRadialGradient(g.w * 0.14, g.horizon * 0.15, 0, g.w * 0.14, g.horizon * 0.15, g.w * 0.4);
    sun.addColorStop(0, 'rgba(255, 252, 230, 0.75)');
    sun.addColorStop(1, 'rgba(255, 252, 230, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, g.w, g.horizon + 6);
    for (let i = 0; i < 5; i++) {
      cloud(ctx, r, r() * g.w, g.horizon * (0.2 + r() * 0.55), unit * (0.6 + r() * 0.6), 'rgba(255, 255, 255, 0.92)', 'rgba(170, 196, 225, 0.55)');
    }
  } else if (mode === 'morning') {
    const sx = g.w * 0.24;
    const sun = ctx.createRadialGradient(sx, g.horizon, 0, sx, g.horizon, g.w * 0.55);
    sun.addColorStop(0, 'rgba(255, 226, 150, 0.85)');
    sun.addColorStop(0.3, 'rgba(255, 170, 110, 0.35)');
    sun.addColorStop(1, 'rgba(255, 150, 110, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, g.w, g.horizon + 6);
    ctx.fillStyle = '#fff3cf';
    ctx.beginPath();
    ctx.arc(sx, g.horizon - 2, Math.max(8, g.w * 0.028), 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      cloud(ctx, r, r() * g.w, g.horizon * (0.15 + r() * 0.55), unit * (0.5 + r() * 0.6), 'rgba(255, 205, 190, 0.85)', 'rgba(150, 90, 140, 0.45)');
    }
  } else {
    // Faint milky way
    ctx.save();
    ctx.globalAlpha = mode === 'qadr' ? 0.035 : 0.03;
    ctx.fillStyle = '#c9d4ff';
    for (let i = 0; i < 40; i++) {
      const t = r();
      ctx.beginPath();
      ctx.ellipse(t * g.w, g.horizon * (0.85 - t * 0.7) + (r() - 0.5) * 30, 30 + r() * 50, 10 + r() * 14, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    stars(ctx, r, g, Math.round((mode === 'qadr' ? 340 : 260) * Math.min(1.3, g.w / 1100 + 0.2)));

    if (mode === 'qadr') {
      // Soft curtains of green and gold light
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let band = 0; band < 3; band++) {
        const p0 = r() * 6;
        const base = g.horizon * (0.35 + band * 0.18);
        for (let x = 0; x < g.w; x += 3) {
          const y = base + Math.sin(x / g.w * 6 + p0) * g.horizon * 0.08;
          const len = g.horizon * (0.18 + 0.1 * Math.sin(x / g.w * 17 + p0));
          const a = 0.05 + 0.04 * Math.sin(x / g.w * 23 + p0 * 2);
          const col = band === 1 ? '253, 224, 120' : '110, 231, 183';
          const lg = ctx.createLinearGradient(0, y - len, 0, y);
          lg.addColorStop(0, `rgba(${col}, 0)`);
          lg.addColorStop(1, `rgba(${col}, ${a})`);
          ctx.fillStyle = lg;
          ctx.fillRect(x, y - len, 3, len);
        }
      }
      ctx.restore();
      const hg = ctx.createRadialGradient(g.cx, g.horizon, 0, g.cx, g.horizon, g.w * 0.5);
      hg.addColorStop(0, 'rgba(255, 205, 120, 0.35)');
      hg.addColorStop(1, 'rgba(255, 205, 120, 0)');
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, g.w, g.horizon + 6);
    }
    moon(ctx, g.w * 0.84, g.horizon * 0.3, Math.max(9, g.w * 0.02), mode === 'night');
  }

  const px = screenX(g, riverX(rv, 30), 30);
  const [far, near] = HILLS[mode];
  ctx.fillStyle = far;
  hillPath(ctx, g, r, g.h * 0.075, px, g.w * 0.12);
  palace(ctx, px, g.horizon + 1, Math.max(26, g.h * 0.085), mode);
  ctx.fillStyle = near;
  hillPath(ctx, g, r, g.h * 0.035, px, g.w * 0.1);
}

// ── Ground (painted in daylight colours, then graded for the mode) ──

function riverEdges(g: Geom, rv: River, widen: number) {
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let z = 0.8; z < 40; z *= 1.05) {
    const xc = riverX(rv, z);
    const y = screenY(g, z);
    left.push([screenX(g, xc - rv.halfW * widen, z), y]);
    right.push([screenX(g, xc + rv.halfW * widen, z), y]);
  }
  return { left, right };
}

function fillRiver(ctx: CanvasRenderingContext2D, g: Geom, rv: River, widen: number) {
  const { left, right } = riverEdges(g, rv, widen);
  ctx.beginPath();
  left.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();
}

function paintGround(ctx: CanvasRenderingContext2D, g: Geom, rv: River, page: number) {
  const r = rng(page * 131 + 3);
  const gh = g.frontY - g.horizon;
  const grad = ctx.createLinearGradient(0, g.horizon, 0, g.h);
  grad.addColorStop(0, '#b9dca8');
  grad.addColorStop(0.12, '#93c985');
  grad.addColorStop(0.45, '#5eac54');
  grad.addColorStop(1, '#2c8538');
  ctx.fillStyle = grad;
  ctx.fillRect(0, g.horizon - 1, g.w, g.h - g.horizon + 1);

  // Sunlit patches
  for (let i = 0; i < 7; i++) {
    const x = r() * g.w;
    const y = g.horizon + gh * (0.25 + r() * 0.75);
    const rad = g.w * (0.12 + r() * 0.15);
    const lg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    lg.addColorStop(0, 'rgba(255, 255, 200, 0.13)');
    lg.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = lg;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.35);
    ctx.translate(-x, -y);
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    ctx.restore();
  }

  // Distant tree line along the horizon
  ctx.fillStyle = '#6ea775';
  const lineH = Math.max(3, g.h * 0.012);
  for (let x = -4; x < g.w + 4; x += lineH * 0.7) {
    const rad = lineH * (0.5 + r() * 0.6);
    ctx.beginPath();
    ctx.arc(x, g.horizon + 1 - rad * 0.4, rad, Math.PI, 0);
    ctx.fill();
  }

  // Distant groves on the far meadow and beside the garden
  const groves: { x: number; y: number; z: number; s: number; tone: number; tall: boolean }[] = [];
  for (let c = 0; c < 70; c++) {
    const cz = 2.6 + Math.pow(r(), 1.4) * 24;
    const cx = (r() * 2 - 1) * 1.2 * cz;
    const count = 6 + Math.floor(r() * 18);
    for (let k = 0; k < count; k++) {
      const z = cz * (1 + (r() - 0.5) * 0.18);
      const xw = cx + (r() - 0.5) * 0.35 * z;
      if (Math.abs(xw) < fieldHalfAt(z) + 0.05 * z) continue;
      if (Math.abs(xw - riverX(rv, z)) < rv.halfW * 1.6) continue;
      groves.push({ x: screenX(g, xw, z), y: screenY(g, z), z, s: g.treeH * treeScale(z) * (0.55 + r() * 0.35), tone: r(), tall: r() < 0.22 });
    }
  }
  groves.sort((a, b) => b.z - a.z);
  for (const t of groves) {
    const dark = t.tone < 0.5 ? '#2f6b3f' : '#3b7a3a';
    const light = t.tone < 0.5 ? '#5fa86a' : '#79b85c';
    ctx.fillStyle = 'rgba(20, 60, 25, 0.25)';
    ctx.beginPath();
    ctx.ellipse(t.x + t.s * 0.08, t.y, t.s * 0.28, t.s * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    if (t.tall) {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(t.x, t.y - t.s * 0.45, t.s * 0.11, t.s * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.ellipse(t.x - t.s * 0.04, t.y - t.s * 0.5, t.s * 0.05, t.s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#5b3a1e';
      ctx.fillRect(t.x - t.s * 0.025, t.y - t.s * 0.3, t.s * 0.05, t.s * 0.3);
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.arc(t.x, t.y - t.s * 0.5, t.s * 0.27, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.arc(t.x - t.s * 0.08, t.y - t.s * 0.58, t.s * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Fine grass texture
  for (let i = 0; i < 2200; i++) {
    const y = g.horizon + Math.pow(r(), 0.7) * gh;
    const near = (y - g.horizon) / gh;
    ctx.fillStyle = r() < 0.5 ? 'rgba(20, 70, 20, 0.12)' : 'rgba(230, 255, 200, 0.10)';
    ctx.fillRect(r() * g.w, y, 0.6 + near * 1.6, 0.6 + near * 2.4);
  }

  // River: grassy bank, water, ripples
  ctx.fillStyle = '#cfe0a4';
  fillRiver(ctx, g, rv, 1.32);
  const water = ctx.createLinearGradient(0, g.horizon, 0, g.h);
  water.addColorStop(0, '#e1f5ff');
  water.addColorStop(0.15, '#8fd3f5');
  water.addColorStop(0.6, '#3c9fe0');
  water.addColorStop(1, '#1f78c4');
  ctx.fillStyle = water;
  fillRiver(ctx, g, rv, 1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineCap = 'round';
  for (let s = 0; s < 6; s++) {
    const off = (r() - 0.5) * 1.4 * rv.halfW;
    ctx.lineWidth = 1 + r();
    ctx.setLineDash([6 + r() * 10, 10 + r() * 22]);
    ctx.beginPath();
    for (let z = 0.85; z < 12; z *= 1.04) {
      const x = screenX(g, riverX(rv, z) + off, z);
      const y = screenY(g, z);
      if (z === 0.85) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Flowers scattered in the meadow
  const scale = g.treeH / 120;
  const petals = ['#ffffff', '#fbcfe8', '#f9a8d4', '#fde68a', '#c4b5fd', '#fca5a5'];
  for (let i = 0; i < 900; i++) {
    const z = 0.9 + Math.pow(r(), 1.7) * 11;
    const xw = (r() * 2 - 1) * 1.15 * z;
    if (Math.abs(xw - riverX(rv, z)) < rv.halfW * 1.55) continue;
    const x = screenX(g, xw, z);
    const y = screenY(g, z);
    const s = (2.6 / Math.pow(z, 0.85)) * scale * (0.7 + r() * 0.6);
    ctx.fillStyle = petals[Math.floor(r() * petals.length)];
    if (s < 1.4) {
      ctx.fillRect(x, y, Math.max(0.8, s), Math.max(0.8, s));
      continue;
    }
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * s * 0.6, y + Math.sin(a) * s * 0.4, s * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(x, y, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grass tufts up close
  ctx.lineCap = 'round';
  for (let i = 0; i < 520; i++) {
    const z = 0.85 + r() * 1.8;
    const xw = (r() * 2 - 1) * 1.1 * z;
    if (Math.abs(xw - riverX(rv, z)) < rv.halfW * 1.35) continue;
    const x = screenX(g, xw, z);
    const y = screenY(g, z);
    const len = (9 / z) * scale * (0.6 + r() * 0.8);
    ctx.lineWidth = Math.max(0.7, 1.4 / z);
    for (let b = -1; b <= 1; b++) {
      ctx.strokeStyle = r() < 0.5 ? '#2e7d32' : '#7cc46f';
      ctx.beginPath();
      ctx.moveTo(x + b * len * 0.15, y);
      ctx.quadraticCurveTo(x + b * len * 0.3, y - len * 0.6, x + b * len * 0.55 + (r() - 0.5) * len * 0.3, y - len);
      ctx.stroke();
    }
  }
}

const backdropCache = new Map<string, HTMLCanvasElement>();

/** Sky + graded ground for one size / mode / page, at device resolution. */
export function getBackdrop(g: Geom, dpr: number, mode: Mode, page: number, rv: River): HTMLCanvasElement {
  const key = `${g.w}x${g.h}@${dpr}:${mode}:${page}`;
  const hit = backdropCache.get(key);
  if (hit) return hit;
  if (backdropCache.size > 6) backdropCache.clear();

  const pw = Math.round(g.w * dpr);
  const ph = Math.round(g.h * dpr);
  const ground = makeCanvas(pw, ph);
  const gctx = ground.getContext('2d');
  if (gctx) {
    gctx.scale(dpr, dpr);
    paintGround(gctx, g, rv, page);
    gradeCanvas(ground, mode);
  }
  const out = makeCanvas(pw, ph);
  const ctx = out.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
    paintSky(ctx, g, mode, rv, page);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(ground, 0, 0);
  }
  backdropCache.set(key, out);
  return out;
}
