import { useEffect, useRef, useState } from 'react';
import type { TreeType } from '../../types';
import { GRID_COLS, GRID_ROWS } from '../../utils/constants';
import { pr } from '../../utils/prng';
import { SPRITE_BASE_PAD, SPRITE_H, SPRITE_W, getTreeSprites, makeGrassPattern } from './treeSprites';
import styles from './Forest.module.css';

interface ForestCanvasProps {
  items: TreeType[];
  /** Index of the first item in the whole forest, so every tree keeps its look across pages. */
  startIndex: number;
}

const GROW_MS = 480;

interface Placed {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where tree `i` of a page sits: rows of pines, back to front, with seeded jitter. */
function layout(i: number, globalIdx: number, width: number, height: number): Placed {
  const col = i % GRID_COLS;
  const row = Math.floor(i / GRID_COLS);
  const cellW = width / GRID_COLS;
  const baseTreeW = cellW * 1.9;
  const treeH = Math.min((baseTreeW * SPRITE_H) / SPRITE_W, height * 0.3);
  const treeW = (treeH * SPRITE_W) / SPRITE_H;
  const rowH = (height - treeH) / (GRID_ROWS - 0.6);

  const s = globalIdx * 7 + 11;
  const scale = 0.84 + pr(s) * 0.3;
  const w = treeW * scale;
  const h = treeH * scale;
  const cx = (col + 0.5 + (pr(s + 1) - 0.5) * 0.5 + (row % 2) * 0.25) * cellW;
  const baseY = treeH + row * rowH + (pr(s + 2) - 0.5) * rowH * 0.35;
  return { x: cx - w / 2, y: baseY - h + (h * SPRITE_BASE_PAD) / SPRITE_H, w, h };
}

export default function ForestCanvas({ items, startIndex }: ForestCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevRef = useRef({ start: startIndex, count: items.length });
  const growStartRef = useRef<Map<number, number>>(new Map());
  const placedRef = useRef<Placed[]>([]);

  const [hoverTooltip, setHoverTooltip] = useState<{ x: number; y: number } | null>(null);

  // Track newly planted trees on the same page for the grow animation.
  useEffect(() => {
    const prev = prevRef.current;
    const now = performance.now();
    if (prev.start === startIndex && items.length > prev.count) {
      for (let i = prev.count; i < items.length; i++) growStartRef.current.set(i, now);
    } else if (prev.start !== startIndex || items.length < prev.count) {
      growStartRef.current.clear();
    }
    prevRef.current = { start: startIndex, count: items.length };
  }, [items, startIndex]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const sprites = getTreeSprites();
    let pattern: CanvasPattern | null = null;
    let frame = 0;

    const render = () => {
      frame = 0;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width;
      const height = rect.height;
      const pxW = Math.round(width * dpr);
      const pxH = Math.round(height * dpr);
      if (canvas.width !== pxW || canvas.height !== pxH) {
        canvas.width = pxW;
        canvas.height = pxH;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      pattern ??= makeGrassPattern(ctx);
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }

      const now = performance.now();
      let animating = false;
      const placed: Placed[] = new Array(items.length);

      for (let i = 0; i < items.length; i++) {
        const globalIdx = startIndex + i;
        const p = layout(i, globalIdx, width, height);
        placed[i] = p;
        const pool = items[i] === 'qadr' ? sprites.qadr : sprites.standard;
        const sprite = pool[Math.floor(pr(globalIdx * 13 + 5) * pool.length)];

        const started = growStartRef.current.get(i);
        if (started === undefined) {
          ctx.drawImage(sprite, p.x, p.y, p.w, p.h);
          continue;
        }
        const t = (now - started) / GROW_MS;
        if (t >= 1) {
          growStartRef.current.delete(i);
          ctx.drawImage(sprite, p.x, p.y, p.w, p.h);
          continue;
        }
        animating = true;
        // Springy grow from the trunk base: overshoots slightly, then settles.
        const sy = Math.max(0, 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 1.5));
        const sx = 0.5 + 0.5 * Math.min(1, t * 1.6);
        const w = p.w * sx;
        const h = p.h * sy;
        ctx.drawImage(sprite, p.x + (p.w - w) / 2, p.y + p.h - h, w, h);
      }
      placedRef.current = placed;

      if (animating) frame = requestAnimationFrame(render);
    };

    render();
    const resizeObserver = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(render);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items, startIndex]);

  // Hover detection for Qadr trees (front-most tree wins)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const placed = placedRef.current;
    for (let i = placed.length - 1; i >= 0; i--) {
      const p = placed[i];
      if (x >= p.x + p.w * 0.2 && x <= p.x + p.w * 0.8 && y >= p.y + p.h * 0.1 && y <= p.y + p.h) {
        if (items[i] === 'qadr') {
          setHoverTooltip({ x: p.x + p.w / 2, y: p.y + p.h * 0.1 });
          return;
        }
        break;
      }
    }
    setHoverTooltip(null);
  };

  return (
    <div ref={containerRef} className={styles.canvasWrapper}>
      <canvas
        ref={canvasRef}
        className={styles.canvasElement}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverTooltip(null)}
        role="img"
        aria-label={`Forest page with ${items.length.toLocaleString()} trees`}
      />
      {hoverTooltip && (
        <div
          className={styles.qadrTooltipCanvas}
          style={{
            left: `${hoverTooltip.x}px`,
            top: `${hoverTooltip.y - 8}px`,
          }}
        >
          ×1000
        </div>
      )}
    </div>
  );
}
