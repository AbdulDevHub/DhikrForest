import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SavedState } from '../types';
import type { CloudForest } from '../firebase/cloud';
import type { Cloud } from './useCloud';
import { totalValue } from '../lib/forestSegments';
import { hijriDate } from '../lib/qadr';

const SYNC_EVERY_MS = 15_000;
const BACKUP_EVERY_MS = 60_000;

function forestSnapshot(s: SavedState): CloudForest {
  return { segments: s.segments, goal: s.goal, streak: s.streak, daily: s.daily, resetAt: s.resetAt };
}

/**
 * A newer reset wins outright (so a reset isn't undone by an older, bigger
 * backup). Otherwise the bigger forest wins; streak and today's count take
 * the most recent / highest.
 */
function mergeForest(local: SavedState, remote: CloudForest): SavedState {
  const remoteResetAt = remote.resetAt ?? 0;
  if (local.resetAt > remoteResetAt) return local;
  const remoteNewerReset = remoteResetAt > local.resetAt;
  const useRemoteTrees = remoteNewerReset || totalValue(remote.segments ?? []) > totalValue(local.segments);
  const remoteStreakNewer = remoteNewerReset || (remote.streak?.lastGoalDay ?? '') > (local.streak.lastGoalDay ?? '');
  const sameDay = remote.daily?.day === local.daily.day;
  return {
    ...local,
    segments: useRemoteTrees ? remote.segments : local.segments,
    streak: remoteStreakNewer ? remote.streak : local.streak,
    daily: sameDay ? { day: local.daily.day, count: Math.max(local.daily.count, remote.daily.count) } : local.daily,
    resetAt: Math.max(local.resetAt, remoteResetAt),
  };
}

/**
 * Keeps the signed-in user's leaderboard row and forest backup in step with
 * this device: flushes pending trees, restores the forest on a new device,
 * and shares the one Laylatul Qadr night across devices.
 */
export function useCloudSync(
  cloud: Cloud,
  state: SavedState,
  setState: Dispatch<SetStateAction<SavedState>>,
  showToast: (msg: string) => void
) {
  const stateRef = useRef(state);
  stateRef.current = state;
  const profileRef = useRef(cloud.profile);
  profileRef.current = cloud.profile;
  const inFlight = useRef(false);
  const restoredFor = useRef<string | null>(null);
  const restoring = useRef(false);
  const lastBackup = useRef<string>('');
  const qadrPushed = useRef<string | null>(null);

  const uid = cloud.syncUid;

  const flush = useCallback(async () => {
    const mod = cloud.module.current;
    const profile = profileRef.current;
    const amount = uid ? (stateRef.current.pending[uid] ?? 0) : 0;
    if (!mod || !uid || !profile || inFlight.current || !navigator.onLine || amount <= 0) return;
    inFlight.current = true;
    try {
      const sent = await mod.pushTrees(uid, amount, profile);
      if (sent > 0) {
        setState((s) => {
          const left = (s.pending[uid] ?? 0) - sent;
          const pending = { ...s.pending };
          if (left > 0) pending[uid] = left;
          else delete pending[uid];
          return { ...s, pending };
        });
      }
    } catch {
      /* rejected or offline: keep it pending and try again next tick */
    } finally {
      inFlight.current = false;
    }
  }, [cloud.module, uid, setState]);

  // Restore (or seed) the cloud copy of the forest once per sign-in; retried until it works.
  const restore = useCallback(async () => {
    const mod = cloud.module.current;
    if (!mod || !uid || restoredFor.current === uid || restoring.current || !navigator.onLine) return;
    restoring.current = true;
    try {
      const remote = await mod.loadForest(uid);
      if (remote) setState((s) => mergeForest(s, remote));
      restoredFor.current = uid;
      lastBackup.current = remote ? JSON.stringify(remote) : '';
    } catch {
      /* offline or transient: the next tick retries */
    } finally {
      restoring.current = false;
    }
  }, [cloud.module, uid, setState]);

  const backup = useCallback(async () => {
    const mod = cloud.module.current;
    if (!mod || !uid || restoredFor.current !== uid || !navigator.onLine) return;
    const snapshot = forestSnapshot(stateRef.current);
    const json = JSON.stringify(snapshot);
    if (json === lastBackup.current) return;
    try {
      await mod.saveForest(uid, snapshot);
      lastBackup.current = json;
    } catch {
      /* try again next tick */
    }
  }, [cloud.module, uid]);

  useEffect(() => {
    restore();
  }, [restore]);

  // Push a reset to the cloud right away so another device can't resurrect the old forest.
  const resetAt = state.resetAt;
  useEffect(() => {
    if (resetAt > 0) backup();
  }, [resetAt, backup]);

  useEffect(() => {
    if (!uid) return;
    const syncId = setInterval(() => {
      restore();
      flush();
    }, SYNC_EVERY_MS);
    const backupId = setInterval(backup, BACKUP_EVERY_MS);
    const onOnline = () => {
      restore();
      flush();
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        flush();
        backup();
      }
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(syncId);
      clearInterval(backupId);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [uid, flush, backup, restore]);

  // One Laylatul Qadr night per year across all devices.
  const profile = cloud.profile;
  useEffect(() => {
    const mod = cloud.module.current;
    if (!mod || !uid || !profile) return;
    const now = Date.now();
    const thisYear = hijriDate(new Date()).year;
    const local = state.qadr;

    const remoteYear = profile.qadrActivatedAt ? hijriDate(new Date(profile.qadrActivatedAt)).year : null;
    if (remoteYear === thisYear && profile.qadrExpiresAt && local?.hijriYear !== thisYear) {
      setState((s) => ({
        ...s,
        qadr: { hijriYear: thisYear, activatedAt: profile.qadrActivatedAt!, expiresAt: profile.qadrExpiresAt! },
      }));
      return;
    }

    // Used tonight on this device before signing in: record it on the account (once).
    const localActive = local && local.hijriYear === thisYear && now < local.expiresAt;
    const key = local ? `${uid}:${local.activatedAt}` : null;
    if (localActive && remoteYear !== thisYear && key && qadrPushed.current !== key) {
      qadrPushed.current = key;
      mod.activateQadr(uid, local.expiresAt).catch(() => {
        showToast(
          '🌙 Your account already used Laylatul Qadr this year, so ×1000 trees here count ×1 on the leaderboard.'
        );
      });
    }
  }, [cloud.module, uid, profile, state.qadr, setState, showToast]);

  return { flush };
}
