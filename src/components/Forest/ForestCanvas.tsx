import { useEffect, useMemo, useRef, useState } from 'react';
import type { EffectiveTimeOfDay, TreeType } from '../../types';
import { SPRITE_BASE, SPRITE_H, SPRITE_W, getSprites, glow, spriteFor } from './forestArt';
import { HAZE, getBackdrop, layoutPage, makeGeom, riverFor } from './forestScene';
import type { Geom, Slot } from './forestScene';
import { ForestFx } from './forestFx';
import styles from './Forest.module.css';

interface ForestCanvasProps {
  items: TreeType[];
  /** Index of the first item in the whole forest, so every tree keeps its look across pages. */
  startIndex: number;
  page: number;
  mode: EffectiveTimeOfDay;
}

const GROW_MS = 520;
const SHADOW: Record<EffectiveTimeOfDay, string> = {
  morning: 'rgba(60, 30, 40, 0.22)',
  afternoon: 'rgba(10, 50, 20, 0.26)',
  night: 'rgba(0, 0, 10, 0.32)',
  qadr: 'rgba(0, 0, 10, 0.32)',
};

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Size {
  w: number;
  h: number;
  dpr: number;
}

export default function ForestCanvas({ items, startIndex, page, mode }: ForestCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const fx = useRef<ForestFx | null>(null);
  const prevRef = useRef({ start: startIndex, count: items.length });
  const growStart = useRef<Map<number, number>>(new Map());
  const [size, setSize] = useState<Size | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const rv = useMemo(() => riverFor(page), [page]);
  const geom: Geom | null = useMemo(() => (size ? makeGeom(size.w, size.h) : null), [size]);
  const slots: Slot[] = useMemo(() => (geom ? layoutPage(geom, rv, page) : []), [geom, rv, page]);
  // Back to front, so nearer trees overlap farther ones.
  const order = useMemo(() => slots.map((_, i) => i).sort((a, b) => slots[b].z - slots[a].z), [slots]);

  // Track the canvas size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const next = { w: Math.round(rect.width), h: Math.round(rect.height), dpr: Math.min(window.devicePixelRatio || 1, 2) };
      setSize((prev) => (prev && prev.w === next.w && prev.h === next.h && prev.dpr === next.dpr ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Ambient life layer: runs only while visible and motion is welcome.
  useEffect(() => {
    const canvas = fxRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;
    const engine = new ForestFx(canvas);
    fx.current = engine;
    let visible = true;
    const sync = () => {
      if (visible && document.visibilityState === 'visible' && !reducedMotion()) engine.start();
      else engine.stop();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      engine.stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      fx.current = null;
    };
  }, []);

  useEffect(() => {
    if (size && geom) fx.current?.setScene(geom, size.dpr, mode, rv);
  }, [size, geom, mode, rv]);

  // Newly planted trees on this page grow in, with a burst of light.
  useEffect(() => {
    const prev = prevRef.current;
    const now = performance.now();
    if (prev.start === startIndex && items.length > prev.count) {
      for (let i = prev.count; i < items.length; i++) {
        if (!reducedMotion()) growStart.current.set(i, now);
        const s = slots[i];
        if (s) fx.current?.burst(s.x, s.y, s.size, items[i] === 'qadr');
      }
    } else if (prev.start !== startIndex || items.length < prev.count) {
      growStart.current.clear();
    }
    prevRef.current = { start: startIndex, count: items.length };
  }, [items, startIndex, slots]);

  // Scene: cached backdrop + shadows + trees + haze + Qadr halos
  useEffect(() => {
    const canvas = sceneRef.current;
    if (!canvas || !size || !geom) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { dpr } = size;
    const pw = Math.round(geom.w * dpr);
    const ph = Math.round(geom.h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    const backdrop = getBackdrop(geom, dpr, mode, page, rv);
    const sprites = getSprites(mode);
    const haze = HAZE[mode];
    const night = mode === 'night' || mode === 'qadr';
    let frame = 0;

    const render = () => {
      frame = 0;
      const now = performance.now();
      let animating = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(backdrop, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = SHADOW[mode];
      ctx.beginPath();
      for (const i of order) {
        if (i >= items.length) continue;
        const s = slots[i];
        const rx = s.size * 0.3;
        ctx.moveTo(s.x + rx * 1.25, s.y);
        ctx.ellipse(s.x + rx * 0.25, s.y, rx, rx * 0.26, 0, 0, Math.PI * 2);
      }
      ctx.fill();

      for (const i of order) {
        if (i >= items.length) continue;
        const s = slots[i];
        const sprite = spriteFor(sprites, items[i], startIndex + i);
        let h = s.size;
        let w = (h * SPRITE_W) / SPRITE_H;
        const started = growStart.current.get(i);
        if (started !== undefined) {
          const t = (now - started) / GROW_MS;
          if (t >= 1) growStart.current.delete(i);
          else {
            animating = true;
            h *= Math.max(0, 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 1.5));
            w *= 0.4 + 0.6 * Math.min(1, t * 1.8);
          }
        }
        if (h <= 0.5) continue;
        ctx.drawImage(sprite, s.x - w / 2, s.y - (h * SPRITE_BASE) / SPRITE_H, w, h);
      }

      // Aerial perspective: distant ground and trees fade into the sky colour
      const haze0 = geom.horizon - 2;
      const haze1 = geom.horizon + (geom.frontY - geom.horizon) * 0.3;
      const hg = ctx.createLinearGradient(0, haze0, 0, haze1);
      hg.addColorStop(0, `rgba(${haze[0]}, ${haze[1]}, ${haze[2]}, 0.42)`);
      hg.addColorStop(1, `rgba(${haze[0]}, ${haze[1]}, ${haze[2]}, 0)`);
      ctx.fillStyle = hg;
      ctx.fillRect(0, haze0, geom.w, haze1 - haze0);

      // Laylatul Qadr trees glow, more so at night
      ctx.globalCompositeOperation = 'lighter';
      const halo = glow(255, 214, 120);
      ctx.globalAlpha = night ? 0.42 : 0.28;
      for (const i of order) {
        if (i >= items.length || items[i] !== 'qadr') continue;
        const s = slots[i];
        const r = s.size * 0.6;
        ctx.drawImage(halo, s.x - r, s.y - s.size * 0.62 - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      if (animating) frame = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items, startIndex, page, mode, size, geom, rv, slots, order]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Front-most tree under the pointer wins
    for (let k = order.length - 1; k >= 0; k--) {
      const i = order[k];
      if (i >= items.length) continue;
      const s = slots[i];
      const w = (s.size * SPRITE_W) / SPRITE_H;
      if (x >= s.x - w * 0.32 && x <= s.x + w * 0.32 && y >= s.y - s.size * 0.92 && y <= s.y) {
        const n = (startIndex + i + 1).toLocaleString();
        setTooltip({ x: s.x, y: s.y - s.size * 0.95, text: items[i] === 'qadr' ? `✨ Tree #${n} · ×1000` : `🌳 Tree #${n}` });
        return;
      }
    }
    setTooltip(null);
  };

  return (
    <div ref={containerRef} className={styles.canvasWrapper}>
      <canvas
        ref={sceneRef}
        className={styles.canvasElement}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        role="img"
        aria-label={`Garden ${page + 1}: ${items.length.toLocaleString()} trees beside a river`}
      />
      <canvas ref={fxRef} className={styles.fxCanvas} aria-hidden="true" />
      {tooltip && (
        <div className={styles.treeTooltip} style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
