import { useEffect, useState } from 'react';

/**
 * Number state that reads its initial value from localStorage and
 * writes back to it whenever it changes. Mirrors the original app's
 * plain `localStorage.getItem` / `setItem` calls.
 */
export function useStoredNumber(key: string, fallback = 0): [number, (value: number | ((prev: number) => number)) => void] {
  const [value, setValue] = useState<number>(() => {
    const raw = localStorage.getItem(key);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  });

  useEffect(() => {
    localStorage.setItem(key, String(value));
  }, [key, value]);

  return [value, setValue];
}
