import { useCallback, useEffect, useRef, useState } from 'react';
import { ZIKRS, MILESTONE_THRESHOLDS, MILESTONES } from '../data/zikrs';
import { STORAGE_KEYS, TREES_PER_PAGE } from '../utils/constants';
import { numPages, numRows } from '../utils/geometry';
import { useStoredNumber } from './useStoredNumber';
import type { LeafParticle, TreeItem } from '../types';

let leafIdSeq = 0;

function loadStoredItems(): TreeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.treeItems);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    /* ignore parse error */
  }

  // Fallback / legacy migration: if treeItems not initialized yet but treeCount exists
  const legacyCountStr = localStorage.getItem(STORAGE_KEYS.legacyTreeCount);
  if (legacyCountStr) {
    const count = parseInt(legacyCountStr, 10) || 0;
    if (count > 0) {
      const items: TreeItem[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        type: 'standard',
      }));
      localStorage.setItem(STORAGE_KEYS.treeItems, JSON.stringify(items));
      return items;
    }
  }

  return [];
}

export function useForestState() {
  const [totalTrees, setTotalTrees] = useStoredNumber(STORAGE_KEYS.totalTrees, 0);
  const [treeItems, setTreeItems] = useState<TreeItem[]>(loadStoredItems);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [currentZikr, setCurrentZikr] = useState(0);
  const [qadrOn, setQadrOn] = useState(false);

  const [flashKey, setFlashKey] = useState(0);
  const [bumpKey, setBumpKey] = useState(0);

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

  // Persist treeItems to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.treeItems, JSON.stringify(treeItems));
    } catch {
      /* ignore storage quota limits */
    }
  }, [treeItems]);

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

  // Welcome back toast on initial load
  useEffect(() => {
    if (totalTrees > 0) {
      const t = setTimeout(() => {
        showToast(`Welcome back! ${totalTrees.toLocaleString()} trees in Jannah 🌳`);
      }, 900);
      return () => clearTimeout(t);
    }
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
      const itemsToPlant = z.trees; // 1 or 4 items per click
      const valuePerItem = qadrOn ? 1000 : 1;
      const treesToAddTotal = itemsToPlant * valuePerItem;

      const prevTotal = totalTrees;
      const nextTotal = prevTotal + treesToAddTotal;

      const newItems: TreeItem[] = Array.from({ length: itemsToPlant }, (_, i) => ({
        id: Date.now() + i + Math.random(),
        type: qadrOn ? 'qadr' : 'standard',
      }));

      const nextTreeItems = [...treeItems, ...newItems];
      const totalPages = numPages(nextTreeItems.length);
      const newestPageIndex = totalPages - 1;

      setTotalTrees(nextTotal);
      setSessionCount((s) => s + treesToAddTotal);
      setTreeItems(nextTreeItems);
      setCurrentPage(newestPageIndex);

      setFlashKey((k) => k + 1);
      setBumpKey((k) => k + 1);
      spawnLeaves(buttonRect);

      for (const m of MILESTONE_THRESHOLDS) {
        if (nextTotal >= m && prevTotal < m) {
          showToast(MILESTONES[m]);
          break;
        }
      }

      if (qadrOn) pulseGlow(1400);
    },
    [currentZikr, qadrOn, totalTrees, treeItems, setTotalTrees, spawnLeaves, showToast, pulseGlow]
  );

  const reset = useCallback(() => {
    setTotalTrees(0);
    setSessionCount(0);
    setTreeItems([]);
    setCurrentPage(0);
  }, [setTotalTrees]);

  const toggleQadr = useCallback(() => {
    setQadrOn((on) => {
      const next = !on;
      if (next) showToast('🌙 Laylatul Qadr active — every deed ×1000!');
      return next;
    });
  }, [showToast]);

  const totalPages = numPages(treeItems.length);

  // Active page's subset of items
  const startIdx = currentPage * TREES_PER_PAGE;
  const activePageItems = treeItems.slice(startIdx, startIdx + TREES_PER_PAGE);

  return {
    totalTrees,
    sessionCount,
    treeCount: treeItems.length,
    rows: numRows(activePageItems.length),
    currentZikr,
    setCurrentZikr,
    qadrOn,
    toggleQadr,
    plant,
    reset,
    flashKey,
    bumpKey,
    isGlowing,
    toastMessage,
    showToast,
    leaves,
    currentPage,
    setCurrentPage,
    totalPages,
    activePageItems,
  };
}
