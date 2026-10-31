import { useCallback, useEffect, useRef, useState } from 'react';
import type { SavedState } from '../types';
import { currentDeviceId, loadState, parseSigned, saveState } from '../lib/secureStore';
import { STORAGE_KEYS } from '../utils/constants';

const SAVE_DELAY_MS = 400;

/**
 * The signed app state: loaded once, saved (debounced) on every change,
 * flushed when the page is hidden, and kept in step with other open tabs.
 */
export function useSavedState() {
  const [initial] = useState(loadState);
  const [state, setState] = useState<SavedState>(initial.state);
  const lastSavedJson = useRef(JSON.stringify(initial.state));
  const stateRef = useRef(state);
  stateRef.current = state;

  const flush = useCallback(() => {
    const json = JSON.stringify(stateRef.current);
    if (json === lastSavedJson.current) return;
    lastSavedJson.current = json;
    saveState(stateRef.current);
  }, []);

  useEffect(() => {
    const t = setTimeout(flush, SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [state, flush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flush]);

  // Another tab planted: adopt its (validly signed) state instead of overwriting it.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEYS.state || e.newValue === null) return;
      const parsed = parseSigned(e.newValue, currentDeviceId());
      if (parsed.kind !== 'ok') return;
      const json = JSON.stringify(parsed.state);
      if (json === JSON.stringify(stateRef.current)) return;
      lastSavedJson.current = json;
      setState(parsed.state);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { state, setState, tamperedOnLoad: initial.tampered };
}
