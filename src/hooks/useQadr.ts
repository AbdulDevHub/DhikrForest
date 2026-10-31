import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { QadrUse, SavedState } from '../types';
import { appNow, hijriDate, qadrStatus, requestCoords } from '../lib/qadr';
import type { QadrStatus } from '../lib/qadr';

const TICK_MS = 30_000;

/**
 * Laylatul Qadr mode. `status` says whether the toggle can be used right now;
 * `qadrOn` is the user's switch, which only stays on while the night is active.
 */
export function useQadr(
  state: SavedState,
  setState: Dispatch<SetStateAction<SavedState>>,
  showToast: (msg: string) => void
) {
  const [now, setNow] = useState(appNow);
  const status = qadrStatus(now, state.qadr, state.coords);
  const isActive = status.kind === 'active';
  // Re-opening the app during the night keeps the multiplier on.
  const [switchedOn, setSwitchedOn] = useState(isActive);
  const qadrOn = switchedOn && isActive;

  useEffect(() => {
    const tick = () => setNow(appNow());
    const id = setInterval(tick, TICK_MS);
    // Timers are throttled in background tabs, so re-check as soon as we're visible.
    const onVisible = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Fajr arrived while the switch was on.
  useEffect(() => {
    if (switchedOn && !isActive && state.qadr) {
      setSwitchedOn(false);
      showToast('🌅 Fajr has arrived. Laylatul Qadr mode has ended. May Allah accept it 🤲');
    }
  }, [switchedOn, isActive, state.qadr, showToast]);

  /** Re-checks the window, asking for location first if it affects the answer. */
  const refresh = useCallback(async (askLocation = true): Promise<QadrStatus> => {
    let coords = state.coords;
    const current = appNow();
    const h = hijriDate(current);
    const nearWindow = h.month === 9 || (h.month === 10 && h.day === 1);
    if (askLocation && !coords && nearWindow && !state.qadr) {
      coords = await requestCoords();
      if (coords) setState((s) => ({ ...s, coords }));
    }
    setNow(current);
    return qadrStatus(current, state.qadr, coords);
  }, [state.coords, state.qadr, setState]);

  /** Spends this year's one night. Only call when `status.kind === 'available'`. */
  const activate = useCallback(async () => {
    // Location was already asked for when the toggle was tapped.
    const fresh = await refresh(false);
    if (fresh.kind !== 'available') return fresh;
    const use: QadrUse = {
      hijriYear: fresh.hijriYear,
      activatedAt: appNow().getTime(),
      expiresAt: fresh.expiresAt,
    };
    setState((s) => ({ ...s, qadr: use }));
    setSwitchedOn(true);
    const fajr = new Date(use.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    showToast(`🌙 Laylatul Qadr active until Fajr (${fajr}). Every deed ×1000!`);
    return fresh;
  }, [refresh, setState, showToast]);

  const setQadrOn = useCallback(
    (on: boolean) => {
      if (on && !isActive) return;
      setSwitchedOn(on);
      if (on) showToast('🌙 Laylatul Qadr mode back on. Every deed ×1000!');
    },
    [isActive, showToast]
  );

  return { status, qadrOn, setQadrOn, activate, refresh };
}
