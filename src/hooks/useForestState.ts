import { useCallback, useEffect, useRef, useState } from 'react';
import { ZIKRS, MILESTONE_THRESHOLDS, MILESTONES } from '../data/zikrs';
import { MAX_TREE_COUNT, STORAGE_KEYS } from '../utils/constants';
import { numRows } from '../utils/geometry';
import { useStoredNumber } from './useStoredNumber';
import type { LeafParticle } from '../types';

let leafIdSeq = 0;

/** One-time migration from the old position-array localStorage format. */
function migrateLegacyPositions() {
  const old = localStorage.getItem(STORAGE_KEYS.legacyPositions);
  if (old && !localStorage.getItem(STORAGE_KEYS.treeCount)) {
    try {
      const parsed = JSON.parse(old);
      if (Array.isArray(parsed)) {
        localStorage.setItem(STORAGE_KEYS.treeCount, String(parsed.length));
      }
    } catch {
      /* ignore malformed legacy data */
    }
  }
  localStorage.removeItem(STORAGE_KEYS.legacyPositions);
}
migrateLegacyPositions();

export function useForestState() {
  const [totalTrees, setTotalTrees] = useStoredNumber(STORAGE_KEYS.totalTrees, 0);
  const [treeCount, setTreeCount] = useStoredNumber(STORAGE_KEYS.treeCount, 0);
  const [sessionCount, setSessionCount] = useState(0);
  const [currentZikr, setCurrentZikr] = useState(0);
  const [qadrOn, setQadrOn] = useState(false);

  // Ephemeral, replay-on-change triggers for CSS animations. These wrap
  // small, stateless nodes, so remounting them via `key` to replay a
  // keyframe animation is cheap and safe.
  const [flashKey, setFlashKey] = useState(0);
  const [bumpKey, setBumpKey] = useState(0);
  const [scrollKey, setScrollKey] = useState(0);

  // The sky-pulse glow wraps the whole panel (which has its own internal
  // state, e.g. the hadith popover), so it's a real boolean + timer rather
  // than a remount trick.
  const [isGlowing, setIsGlowing] = useState(false);
  const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseGlow = useCallback((durationMs = 1400) => {
    setIsGlowing(true);
    if (glowTimer.current) clearTimeout(glowTimer.current);
    glowTimer.current = setTimeout(() => setIsGlowing(false), durationMs);
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [leaves, setLeaves] = useState<LeafParticle[]>([]);

  const showToast = useCallback(
    (msg: string) => {
      setToastMessage(msg);
      pulseGlow(3500);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastMessage(null), 3500);
    },
    [pulseGlow]
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (glowTimer.current) clearTimeout(glowTimer.current);
    };
  }, []);

  // Welcome-back toast on load, mirroring the original app's behaviour.
  useEffect(() => {
    if (totalTrees > 0) {
      const t = setTimeout(() => {
        showToast(`Welcome back! ${totalTrees.toLocaleString()} trees in Jannah 🌳`);
      }, 900);
      return () => clearTimeout(t);
    }
    // Only ever run once on mount — subsequent totalTrees changes shouldn't retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spawnLeaves = useCallback((originRect: DOMRect | null) => {
    if (!originRect) return;
    const emojis = ['🍃', '🌿', '✨', '💚', '🌱', '🍀'];
    const fresh: LeafParticle[] = Array.from({ length: 7 }, () => {
      const id = leafIdSeq++;
      return {
        id,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        left: originRect.left + originRect.width / 2 + (Math.random() - 0.5) * 70,
        top: originRect.top + Math.random() * 20,
        lx: Math.random() * 140 - 70,
        ly: -58 - Math.random() * 88,
        lr: Math.random() * 360,
        delay: Math.random() * 0.13,
      };
    });
    setLeaves((prev) => [...prev, ...fresh]);
    fresh.forEach((leaf) => {
      setTimeout(() => {
        setLeaves((prev) => prev.filter((l) => l.id !== leaf.id));
      }, 1100);
    });
  }, []);

  const plant = useCallback(
    (buttonRect: DOMRect | null) => {
      const z = ZIKRS[currentZikr];
      const mult = qadrOn ? 1000 : 1;
      const treesToAdd = z.trees * mult;
      const prevTotal = totalTrees;

      const nextTotal = prevTotal + treesToAdd;
      const nextTreeCount = Math.min(MAX_TREE_COUNT, treeCount + treesToAdd);

      setTotalTrees(nextTotal);
      setSessionCount((s) => s + treesToAdd);
      setTreeCount(nextTreeCount);

      setFlashKey((k) => k + 1);
      setBumpKey((k) => k + 1);
      setScrollKey((k) => k + 1);
      spawnLeaves(buttonRect);

      for (const m of MILESTONE_THRESHOLDS) {
        if (nextTotal >= m && prevTotal < m) {
          showToast(MILESTONES[m]);
          break;
        }
      }

      if (qadrOn) pulseGlow(1400);
    },
    [currentZikr, qadrOn, totalTrees, treeCount, setTotalTrees, setTreeCount, spawnLeaves, showToast, pulseGlow]
  );

  const reset = useCallback(() => {
    setTotalTrees(0);
    setSessionCount(0);
    setTreeCount(0);
  }, [setTotalTrees, setTreeCount]);

  const toggleQadr = useCallback(() => {
    setQadrOn((on) => {
      const next = !on;
      if (next) showToast('🌙 Laylatul Qadr active — every deed ×1000!');
      return next;
    });
  }, [showToast]);

  return {
    totalTrees,
    sessionCount,
    treeCount,
    rows: numRows(treeCount),
    currentZikr,
    setCurrentZikr,
    qadrOn,
    toggleQadr,
    plant,
    reset,
    flashKey,
    bumpKey,
    isGlowing,
    scrollKey,
    toastMessage,
    leaves,
  };
}
