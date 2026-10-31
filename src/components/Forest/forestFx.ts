import type { Mode } from './forestArt';
import { glow } from './forestArt';
import type { Geom, River } from './forestScene';
import { riverX, screenX, screenY } from './forestScene';

/**
 * The living layer drawn on a second canvas above the scene: fireflies,
 * drifting light, butterflies, river glints, Qadr orbs and the burst when a
 * tree is planted. About a hundred cheap sprite draws, capped at ~30 fps,
 * paused when the forest is hidden or the user prefers reduced motion.
 */

type Kind = 'mote' | 'petal' | 'butterfly' | 'firefly' | 'orb' | 'glint' | 'twinkle' | 'spark' | 'ring';

interface P {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  phase: number;
  /** River glints travel in depth instead of screen space. */
  z?: number;
  off?: number;
  color?: [number, number, number];
}

const AMBIENT: Record<Mode, Partial<Record<Kind, number>>> = {
  morning: { mote: 22, petal: 14, butterfly: 2, glint: 12 },
  afternoon: { mote: 24, petal: 6, butterfly: 4, glint: 16 },
  night: { firefly: 46, glint: 12 },
  qadr: { orb: 30, firefly: 20, glint: 14 },
};
const TWINKLE_RATE: Record<Mode, number> = { morning: 0, afternoon: 0, night: 0.8, qadr: 1.6 };
const BUTTERFLY_COLORS = ['#fde68a', '#f9a8d4', '#a5f3fc', '#fdba74'];

export class ForestFx {
  private ctx: CanvasRenderingContext2D | null;
  private parts: P[] = [];
  private g: Geom | null = null;
  private rv: River | null = null;
  private mode: Mode = 'night';
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private running = false;
  private time = 0;
  private density = 1;

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  setScene(g: Geom, dpr: number, mode: Mode, rv: River) {
    const changed = !this.g || this.g.w !== g.w || this.g.h !== g.h || this.mode !== mode || this.rv !== rv;
    this.g = g;
    this.dpr = dpr;
    this.rv = rv;
    const pw = Math.round(g.w * dpr);
    const ph = Math.round(g.h * dpr);
    if (this.canvas.width !== pw || this.canvas.height !== ph) {
      this.canvas.width = pw;
      this.canvas.height = ph;
    }
    if (changed) {
      this.mode = mode;
      this.density = Math.max(0.35, Math.min(1.2, (g.w * g.h) / (1100 * 800)));
      this.parts = this.parts.filter((p) => p.kind === 'spark' || p.kind === 'ring');
      this.fillAmbient(true);
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const dt = now - this.last;
      if (dt < 32) return;
      this.last = now;
      this.step(Math.min(dt, 100) / 1000);
      this.draw();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Sparkles and a ring of light where a tree was just planted. */
  burst(x: number, y: number, size: number, qadr: boolean) {
    const n = qadr ? 26 : 14;
    const col: [number, number, number] = qadr ? [255, 214, 110] : [190, 255, 170];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const sp = (40 + Math.random() * 70) * (size / 90 + 0.4);
      this.parts.push({
        kind: 'spark',
        x,
        y: y - size * 0.45,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        age: 0,
        life: 0.7 + Math.random() * 0.5,
        size: 2 + Math.random() * 2.5,
        phase: 0,
        color: Math.random() < 0.3 ? [255, 255, 255] : col,
      });
    }
    this.parts.push({ kind: 'ring', x, y: y - size * 0.4, vx: 0, vy: 0, age: 0, life: 0.6, size: size * 0.5, phase: 0, color: col });
    if (!this.running) this.draw();
  }

  private spawn(kind: Kind, initial: boolean): P {
    const g = this.g!;
    const gh = g.frontY - g.horizon;
    const rand = Math.random;
    const base: P = { kind, x: rand() * g.w, y: 0, vx: 0, vy: 0, age: 0, life: 1, size: 1, phase: rand() * 10 };
    switch (kind) {
      case 'mote':
        return { ...base, y: g.horizon * 0.4 + rand() * (g.h - g.horizon * 0.4), vx: 4 + rand() * 8, vy: -3 - rand() * 6, life: 6 + rand() * 7, age: initial ? rand() * 6 : 0, size: 1 + rand() * 1.6 };
      case 'petal':
        return { ...base, x: rand() * g.w * 1.1 - g.w * 0.1, y: initial ? g.horizon + rand() * gh : g.horizon + rand() * gh * 0.3, vx: 12 + rand() * 14, vy: 7 + rand() * 9, life: 7 + rand() * 5, age: initial ? rand() * 5 : 0, size: 2.2 + rand() * 1.6 };
      case 'butterfly':
        return { ...base, y: g.horizon + gh * (0.35 + rand() * 0.5), vx: (rand() < 0.5 ? -1 : 1) * (14 + rand() * 10), life: 14 + rand() * 10, size: 3.5 + rand() * 2.5, color: [0, 0, 0] };
      case 'firefly':
        return { ...base, y: g.horizon + gh * (0.08 + rand() * 0.92), vx: (rand() - 0.5) * 12, vy: (rand() - 0.5) * 8, life: 6 + rand() * 8, age: initial ? rand() * 6 : 0, size: 10 + rand() * 12 };
      case 'orb':
        return { ...base, y: initial ? g.horizon + rand() * gh : g.horizon + gh * (0.3 + rand() * 0.7), vy: -8 - rand() * 14, life: 9 + rand() * 7, age: initial ? rand() * 8 : 0, size: 14 + rand() * 16 };
      case 'glint': {
        const z = initial ? 0.9 + rand() * 10 : 6 + rand() * 8;
        return { ...base, z, off: (rand() - 0.5) * 1.5, life: 99, size: 1 };
      }
      case 'twinkle':
        return { ...base, y: rand() * g.horizon * 0.85, life: 0.9 + rand() * 0.6, size: 3 + rand() * 4 };
      default:
        return base;
    }
  }

  private fillAmbient(initial: boolean) {
    if (!this.g) return;
    const want = AMBIENT[this.mode];
    const have: Partial<Record<Kind, number>> = {};
    for (const p of this.parts) have[p.kind] = (have[p.kind] ?? 0) + 1;
    for (const [kind, count] of Object.entries(want) as [Kind, number][]) {
      const target = Math.round(count * this.density);
      for (let i = have[kind] ?? 0; i < target; i++) {
        const p = this.spawn(kind, initial);
        if (kind === 'butterfly') p.color = hexToRgb(BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length]);
        this.parts.push(p);
      }
    }
  }

  private step(dt: number) {
    const g = this.g;
    if (!g) return;
    this.time += dt;
    const t = this.time;
    for (const p of this.parts) {
      p.age += dt;
      switch (p.kind) {
        case 'firefly':
          p.vx += Math.sin(t * 1.3 + p.phase) * 6 * dt;
          p.vy += Math.cos(t * 1.1 + p.phase * 1.7) * 5 * dt;
          break;
        case 'orb':
          p.vx = Math.sin(t * 0.6 + p.phase) * 6;
          break;
        case 'butterfly':
          p.vy = Math.sin(t * 2.2 + p.phase) * 16;
          if (p.x < 0 || p.x > g.w) p.vx = -p.vx;
          break;
        case 'spark':
          p.vy += 70 * dt;
          p.vx *= 0.98;
          break;
        case 'glint': {
          const z = (p.z ?? 5) * (1 - dt * 0.12);
          p.z = z;
          if (z < 0.85) Object.assign(p, this.spawn('glint', false));
          continue;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.parts = this.parts.filter((p) => p.age < p.life);
    this.fillAmbient(false);
    const rate = TWINKLE_RATE[this.mode];
    if (rate && Math.random() < rate * dt) this.parts.push(this.spawn('twinkle', false));
  }

  private draw() {
    const ctx = this.ctx;
    const g = this.g;
    if (!ctx || !g) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, g.w, g.h);
    const t = this.time;
    const night = this.mode === 'night' || this.mode === 'qadr';

    for (const p of this.parts) {
      const life = p.age / p.life;
      const fade = Math.sin(Math.min(1, Math.max(0, life)) * Math.PI);
      switch (p.kind) {
        case 'mote': {
          const a = fade * (0.45 + 0.35 * Math.sin(t * 2.3 + p.phase));
          this.light(255, 244, 205, p.x, p.y, p.size * 7, a * 0.8);
          break;
        }
        case 'petal': {
          ctx.save();
          ctx.globalAlpha = Math.min(1, fade * 1.6) * 0.9;
          ctx.translate(p.x, p.y);
          ctx.rotate(t * 2 + p.phase);
          ctx.scale(1, Math.abs(Math.sin(t * 3 + p.phase)) * 0.7 + 0.3);
          ctx.fillStyle = this.mode === 'morning' ? '#fbcfe8' : '#fdf2f8';
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'butterfly': {
          const [r, gg, b] = p.color ?? [255, 255, 255];
          const flap = Math.abs(Math.sin(t * 14 + p.phase));
          ctx.save();
          ctx.globalAlpha = Math.min(1, fade * 3);
          ctx.translate(p.x, p.y);
          ctx.fillStyle = `rgb(${r}, ${gg}, ${b})`;
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(side * p.size * 0.55 * flap, -p.size * 0.15, p.size * 0.6 * flap + 0.4, p.size * 0.75, side * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#3b2a1a';
          ctx.fillRect(-0.5, -p.size * 0.6, 1, p.size * 1.1);
          ctx.restore();
          break;
        }
        case 'firefly': {
          const blink = Math.pow(Math.max(0, Math.sin(t * (1.4 + (p.phase % 1)) + p.phase)), 2);
          this.light(205, 255, 130, p.x, p.y, p.size, fade * blink);
          break;
        }
        case 'orb': {
          const a = fade * (0.6 + 0.3 * Math.sin(t * 1.7 + p.phase));
          this.light(255, 210, 120, p.x, p.y, p.size, a);
          this.light(255, 250, 230, p.x, p.y, p.size * 0.25, a);
          break;
        }
        case 'glint': {
          if (!this.rv) break;
          const z = p.z ?? 5;
          const x = screenX(g, riverX(this.rv, z) + (p.off ?? 0) * this.rv.halfW, z);
          const y = screenY(g, z);
          const a = (0.35 + 0.45 * Math.max(0, Math.sin(t * 4 + p.phase))) * (night ? 0.9 : 0.75);
          this.light(night ? 200 : 255, night ? 220 : 255, 255, x, y, 9 / z + 2, a);
          break;
        }
        case 'twinkle': {
          const a = fade;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = `rgba(255, 250, 230, ${a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x - p.size, p.y);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.stroke();
          ctx.restore();
          this.light(255, 250, 230, p.x, p.y, p.size * 1.6, a * 0.8);
          break;
        }
        case 'spark': {
          const [r, gg, b] = p.color ?? [255, 255, 255];
          this.light(r, gg, b, p.x, p.y, p.size * 5, 1 - life);
          break;
        }
        case 'ring': {
          const [r, gg, b] = p.color ?? [255, 255, 255];
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = `rgba(${r}, ${gg}, ${b}, ${(1 - life) * 0.8})`;
          ctx.lineWidth = 2 * (1 - life) + 0.5;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * (0.3 + life * 1.2), p.size * (0.12 + life * 0.45), 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          break;
        }
      }
    }
  }

  private light(r: number, g: number, b: number, x: number, y: number, size: number, alpha: number) {
    const ctx = this.ctx;
    if (!ctx || alpha <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(glow(r, g, b), x - size, y - size, size * 2, size * 2);
    ctx.restore();
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
