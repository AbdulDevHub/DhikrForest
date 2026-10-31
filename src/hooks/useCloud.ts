import { useCallback, useEffect, useRef, useState } from 'react';
import type { CloudUser, Profile } from '../firebase/cloud';

type CloudModule = typeof import('../firebase/cloud');

let modulePromise: Promise<CloudModule> | null = null;
/** Loads the Firebase SDK on first use (kept out of the main bundle). */
export function loadCloud(): Promise<CloudModule> {
  modulePromise ??= import('../firebase/cloud');
  return modulePromise;
}

export type CloudStatus = 'loading' | 'signedOut' | 'needsNickname' | 'ready' | 'unavailable';

const BLOCKED = ['admin', 'moderator', 'allah', 'fuck', 'shit', 'bitch', 'cunt', 'nigg', 'porn', 'sex', 'kafir'];

/** Returns an error message, or null when the nickname is fine. */
export function nicknameProblem(name: string): string | null {
  const n = name.trim();
  if (n.length < 2 || n.length > 20) return 'Use 2 to 20 characters.';
  if (/[<>{}]/.test(n)) return 'Please avoid < > { } characters.';
  const lower = n.toLowerCase().replace(/[^a-z]/g, '');
  if (BLOCKED.some((w) => lower.includes(w))) return 'Please choose a different nickname.';
  return null;
}

/** Google sign-in state plus the user's public leaderboard profile. */
export function useCloud() {
  const [status, setStatus] = useState<CloudStatus>('loading');
  const [user, setUser] = useState<CloudUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const modRef = useRef<CloudModule | null>(null);

  useEffect(() => {
    let unsubAuth: (() => void) | undefined;
    let unsubProfile: (() => void) | undefined;
    let cancelled = false;

    // Wait until the page is idle so Firebase never competes with first paint.
    const start = () => {
      loadCloud()
        .then((mod) => {
          if (cancelled) return;
          modRef.current = mod;
          unsubAuth = mod.watchAuth((u) => {
            unsubProfile?.();
            unsubProfile = undefined;
            setUser(u);
            setProfile(null);
            if (!u) {
              setStatus('signedOut');
              return;
            }
            setStatus('loading');
            unsubProfile = mod.watchProfile(u.uid, (p) => {
              setProfile(p);
              setStatus(p ? 'ready' : 'needsNickname');
            });
          });
        })
        .catch(() => !cancelled && setStatus('unavailable'));
    };
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 1200);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
      unsubAuth?.();
      unsubProfile?.();
    };
  }, []);

  const signIn = useCallback(async () => {
    const mod = modRef.current ?? (await loadCloud());
    await mod.signIn();
  }, []);

  const signOut = useCallback(async () => {
    await modRef.current?.signOut();
  }, []);

  const saveNickname = useCallback(
    async (nickname: string) => {
      const mod = modRef.current;
      if (!mod || !user) return;
      const clean = nickname.trim();
      if (profile) await mod.renameProfile(user.uid, clean);
      else await mod.createProfile(user.uid, clean);
    },
    [user, profile]
  );

  return {
    status,
    user,
    profile,
    /** uid whose plants count toward the leaderboard (only once a nickname exists). */
    syncUid: status === 'ready' && user ? user.uid : null,
    module: modRef,
    signIn,
    signOut,
    saveNickname,
  };
}

export type Cloud = ReturnType<typeof useCloud>;
