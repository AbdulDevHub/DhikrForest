import { useEffect, useRef, useState } from 'react';
import type { TreeItem } from '../../types';
import { GRID_COLS, GRID_ROWS } from '../../utils/constants';
import styles from './Forest.module.css';

interface ForestCanvasProps {
  items: TreeItem[];
}

// Offscreen sprites for standard and Qadr trees
let offscreenStd: HTMLCanvasElement | null = null;
let offscreenQadr: HTMLCanvasElement | null = null;

function createTreeSprites() {
  const size = 128; // High-res offscreen sprite canvas
  const center = size / 2;
  const radius = size * 0.42;

  // 1. Standard Tree Sprite
  offscreenStd = document.createElement('canvas');
  offscreenStd.width = size;
  offscreenStd.height = size;
  const ctxStd = offscreenStd.getContext('2d');
  if (ctxStd) {
    // Drop shadow
    ctxStd.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctxStd.beginPath();
    ctxStd.arc(center + 2, center + 4, radius, 0, Math.PI * 2);
    ctxStd.fill();

    // Canopy radial gradient
    const grad = ctxStd.createRadialGradient(
      center * 0.8,
      center * 0.7,
      radius * 0.1,
      center,
      center,
      radius
    );
    grad.addColorStop(0, '#4ade80');
    grad.addColorStop(0.5, '#16a34a');
    grad.addColorStop(1, '#064e3b');

    ctxStd.fillStyle = grad;
    ctxStd.beginPath();
    ctxStd.arc(center, center, radius, 0, Math.PI * 2);
    ctxStd.fill();

    // Inner foliage details
    ctxStd.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctxStd.beginPath();
    ctxStd.arc(center * 0.84, center * 0.84, radius * 0.6, 0, Math.PI * 2);
    ctxStd.fill();

    ctxStd.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctxStd.beginPath();
    ctxStd.arc(center * 1.16, center * 1.12, radius * 0.48, 0, Math.PI * 2);
    ctxStd.fill();

    ctxStd.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctxStd.beginPath();
    ctxStd.arc(center * 0.72, center * 0.72, radius * 0.3, 0, Math.PI * 2);
    ctxStd.fill();
  }

  // 2. Laylatul Qadr Tree Sprite
  offscreenQadr = document.createElement('canvas');
  offscreenQadr.width = size;
  offscreenQadr.height = size;
  const ctxQadr = offscreenQadr.getContext('2d');
  if (ctxQadr) {
    // Outer golden glow
    ctxQadr.fillStyle = 'rgba(245, 200, 66, 0.35)';
    ctxQadr.beginPath();
    ctxQadr.arc(center, center, radius * 1.15, 0, Math.PI * 2);
    ctxQadr.fill();

    // Drop shadow
    ctxQadr.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctxQadr.beginPath();
    ctxQadr.arc(center + 2, center + 4, radius, 0, Math.PI * 2);
    ctxQadr.fill();

    // Qadr canopy gradient
    const grad = ctxQadr.createRadialGradient(
      center * 0.8,
      center * 0.7,
      radius * 0.1,
      center,
      center,
      radius
    );
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.35, '#f59e0b');
    grad.addColorStop(0.75, '#10b981');
    grad.addColorStop(1, '#064e3b');

    ctxQadr.fillStyle = grad;
    ctxQadr.beginPath();
    ctxQadr.arc(center, center, radius, 0, Math.PI * 2);
    ctxQadr.fill();

    // Foliage accents
    ctxQadr.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctxQadr.beginPath();
    ctxQadr.arc(center * 0.84, center * 0.84, radius * 0.6, 0, Math.PI * 2);
    ctxQadr.fill();

    // Sparkles
    ctxQadr.fillStyle = '#ffffff';
    ctxQadr.beginPath();
    ctxQadr.arc(center * 0.64, center * 0.6, 3, 0, Math.PI * 2);
    ctxQadr.fill();

    ctxQadr.fillStyle = '#fef08a';
    ctxQadr.beginPath();
    ctxQadr.arc(center * 1.36, center * 0.8, 3.5, 0, Math.PI * 2);
    ctxQadr.fill();

    ctxQadr.fillStyle = '#ffffff';
    ctxQadr.beginPath();
    ctxQadr.arc(center, center * 1.4, 2.5, 0, Math.PI * 2);
    ctxQadr.fill();
  }
}

export default function ForestCanvas({ items }: ForestCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevCountRef = useRef(items.length);
  const animStartTimesRef = useRef<Map<number, number>>(new Map());

  // Tooltip state for Qadr hover
  const [hoverTooltip, setHoverTooltip] = useState<{ x: number; y: number } | null>(null);

  // Initialize offscreen sprites once
  useEffect(() => {
    if (!offscreenStd || !offscreenQadr) {
      createTreeSprites();
    }
  }, []);

  // Track newly added items for pop-in animation
  useEffect(() => {
    const prevCount = prevCountRef.current;
    const now = performance.now();

    if (items.length > prevCount) {
      // Mark new indices for pop-in animation
      for (let i = prevCount; i < items.length; i++) {
        animStartTimesRef.current.set(i, now);
      }
    } else if (items.length < prevCount) {
      animStartTimesRef.current.clear();
    }

    prevCountRef.current = items.length;
  }, [items]);

  // Main canvas render loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animFrameId: number;

    const render = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Grid geometry
      const cellW = width / GRID_COLS;
      const cellH = height / GRID_ROWS;
      const tileSize = Math.min(cellW, cellH);
      const offsetX = (cellW - tileSize) / 2;
      const offsetY = (cellH - tileSize) / 2;
      const now = performance.now();
      const animDuration = 250; // ms

      let isAnimating = false;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);

        const x = col * cellW + offsetX;
        const y = row * cellH + offsetY;

        // Calculate scale factor if tree is animating pop-in
        let scale = 1;
        const startTime = animStartTimesRef.current.get(i);
        if (startTime !== undefined) {
          const elapsed = now - startTime;
          if (elapsed < animDuration) {
            const t = elapsed / animDuration;
            // Overshoot elastic pop-in curve
            scale = Math.sin((t * Math.PI) / 2) * 1.1 - 0.1 * (1 - t);
            if (scale < 0) scale = 0;
            isAnimating = true;
          } else {
            animStartTimesRef.current.delete(i);
          }
        }

        const sprite = item.type === 'qadr' ? offscreenQadr : offscreenStd;
        if (sprite) {
          if (scale === 1) {
            ctx.drawImage(sprite, x, y, tileSize, tileSize);
          } else {
            const centerX = col * cellW + cellW / 2;
            const centerY = row * cellH + cellH / 2;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            ctx.drawImage(sprite, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
            ctx.restore();
          }
        }
      }

      ctx.restore();

      if (isAnimating) {
        animFrameId = requestAnimationFrame(render);
      }
    };

    render();

    const resizeObserver = new ResizeObserver(() => {
      render();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [items]);

  // Handle hover detection for Qadr trees
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellW = rect.width / GRID_COLS;
    const cellH = rect.height / GRID_ROWS;

    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);

    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
      const idx = row * GRID_COLS + col;
      if (idx < items.length && items[idx].type === 'qadr') {
        const treeCenterX = (col + 0.5) * cellW;
        const treeCenterY = row * cellH;
        setHoverTooltip({ x: treeCenterX, y: treeCenterY });
        return;
      }
    }
    setHoverTooltip(null);
  };

  const handleMouseLeave = () => {
    setHoverTooltip(null);
  };

  return (
    <div ref={containerRef} className={styles.canvasWrapper}>
      <canvas
        ref={canvasRef}
        className={styles.canvasElement}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {hoverTooltip && (
        <div
          className={styles.qadrTooltipCanvas}
          style={{
            left: `${hoverTooltip.x}px`,
            top: `${hoverTooltip.y - 8}px`,
          }}
        >
          x1000
        </div>
      )}
    </div>
  );
}
