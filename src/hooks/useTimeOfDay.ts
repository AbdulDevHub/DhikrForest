import { useEffect, useState } from 'react';
import type { EffectiveTimeOfDay, TimeOfDayMode } from '../types';

const STORAGE_KEY = 'dhikr_time_mode';

export function useTimeOfDay(qadrOn: boolean) {
  const [timeMode, setTimeMode] = useState<TimeOfDayMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'auto' || saved === 'morning' || saved === 'afternoon' || saved === 'night') {
      return saved;
    }
    return 'auto';
  });

  const [currentHour, setCurrentHour] = useState<number>(() => new Date().getHours());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, timeMode);
  }, [timeMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const effectiveTimeMode: EffectiveTimeOfDay = qadrOn
    ? 'qadr'
    : timeMode === 'auto'
    ? (currentHour >= 5 && currentHour < 12
        ? 'morning'
        : currentHour >= 12 && currentHour < 19
        ? 'afternoon'
        : 'night')
    : timeMode;

  return {
    timeMode,
    setTimeMode,
    effectiveTimeMode,
  };
}
