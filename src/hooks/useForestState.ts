import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ZIKRS, MILESTONE_THRESHOLDS, MILESTONES } from '../data/zikrs';
import { QADR_MULTIPLIER } from '../utils/constants';
import { numPages, numRows } from '../utils/geometry';
import { appendTrees, pageItems, totalValue, treeCount } from '../lib/forestSegments';
import { todayKey } from '../lib/secureStore';
import { appNow } from '../lib/qadr';
import { useSavedState } from './useSavedState';
import { useQadr } from './useQadr';
import type { LeafParticle, SavedState } from '../types';

let leafIdSeq = 0;

function yesterdayKey(now: Date): string {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

/** Streak still counts if the goal was met today or yesterday. */
function liveStreak(streak: SavedState['streak'], now: Date): number {
  const last = streak.lastGoalDay;
  return last === todayKey(now) || last === yesterdayKey(now) ? streak.count : 0;
}

/** `syncUid`: signed-in user; trees planted while set are queued for the leaderboard. */
export function useForestState(syncUid: string | null) {
  const { state, setState, tamperedOnLoad } = useSavedState();
  const [currentPage, setCurrentPage] = useState<number>(() => numPages(treeCount(state.segments)) - 1);
  const [sessionCount, setSessionCount] = useState(0);
  const [currentZikr, setCurrentZikr] = useState(0);

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

  const showToast = useCallback(
    (msg: string) => {
      setToastMessage(msg);
      pulseGlow(3500);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastMessage(null), 3500);
    },
    [pulseGlow]
  );

  const qadr = useQadr(state, setState, showToast);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (glowTimer.current) clearTimeout(glowTimer.current);
    };
  }, []);

  const totalTrees = totalValue(state.segments);

  // Welcome back / tamper notice on initial load
  useEffect(() => {
    const t = setTimeout(() => {
      if (tamperedOnLoad) {
        showToast('⚠️ Saved data was edited outside the app, so your last verified forest was restored.');
      } else if (totalTrees > 0) {
        showToast(`Welcome back! ${totalTrees.toLocaleString()} trees in Jannah 🌳`);
      }
    }, 900);
    return () => clearTimeout(t);
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
    const ids = new Set(fresh.map((l) => l.id));
    setTimeout(() => setLeaves((prev) => prev.filter((l) => !ids.has(l.id))), 1100);
  }, []);

  const plant = useCallback(
    (buttonRect: DOMRect | null) => {
      const z = ZIKRS[currentZikr];
      const itemsToPlant = z.trees; // 1 or 4 items per click
      // Re-check the clock: the status tick can lag behind Fajr by a few seconds.
      const isQadr = qadr.qadrOn && state.qadr !== null && appNow().getTime() < state.qadr.expiresAt;
      const value = itemsToPlant * (isQadr ? QADR_MULTIPLIER : 1);

      const prevTotal = totalValue(state.segments);
      const nextTotal = prevTotal + value;
      const nextSegments = appendTrees(state.segments, isQadr ? 'qadr' : 'standard', itemsToPlant);

      const now = appNow();
      const today = todayKey(now);
      const dailyCount = (state.daily.day === today ? state.daily.count : 0) + 1;
      let streak = state.streak;
      const goalJustMet = dailyCount === state.goal;
      if (goalJustMet && streak.lastGoalDay !== today) {
        const continues = streak.lastGoalDay === yesterdayKey(now);
        streak = { count: continues ? streak.count + 1 : 1, lastGoalDay: today };
      }

      setState((s) => ({
        ...s,
        segments: nextSegments,
        daily: { day: today, count: dailyCount },
        streak,
        pending: syncUid ? { ...s.pending, [syncUid]: (s.pending[syncUid] ?? 0) + value } : s.pending,
      }));
      setSessionCount((s) => s + value);
      setCurrentPage(numPages(treeCount(nextSegments)) - 1);

      setFlashKey((k) => k + 1);
      setBumpKey((k) => k + 1);
      spawnLeaves(buttonRect);
      if (state.haptics && 'vibrate' in navigator) navigator.vibrate(12);

      let toasted = false;
      for (const m of MILESTONE_THRESHOLDS) {
        if (nextTotal >= m && prevTotal < m) {
          showToast(MILESTONES[m]);
          toasted = true;
          break;
        }
      }
      if (goalJustMet && !toasted) {
        showToast(`🎯 Daily goal of ${state.goal} reached! 🔥 ${streak.count}-day streak`);
      }

      if (isQadr) pulseGlow(1400);
    },
    [currentZikr, qadr.qadrOn, state, syncUid, setState, spawnLeaves, showToast, pulseGlow]
  );

  const reset = useCallback(() => {
    setState((s) => ({
      ...s,
      segments: [],
      daily: { day: todayKey(appNow()), count: 0 },
      streak: { count: 0, lastGoalDay: null },
      resetAt: Date.now(),
    }));
    setSessionCount(0);
    setCurrentPage(0);
  }, [setState]);

  const setGoal = useCallback((goal: number) => setState((s) => ({ ...s, goal })), [setState]);
  const setHaptics = useCallback((haptics: boolean) => setState((s) => ({ ...s, haptics })), [setState]);

  const slots = treeCount(state.segments);
  const totalPages = numPages(slots);
  const activePageItems = useMemo(() => pageItems(state.segments, currentPage), [state.segments, currentPage]);
  const now = appNow();

  return {
    state,
    setState,
    totalTrees,
    sessionCount,
    rows: numRows(activePageItems.length),
    currentZikr,
    setCurrentZikr,
    qadr,
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
    todayCount: state.daily.day === todayKey(now) ? state.daily.count : 0,
    streak: liveStreak(state.streak, now),
    goal: state.goal,
    setGoal,
    haptics: state.haptics,
    setHaptics,
  };
}
