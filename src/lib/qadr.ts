import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan';
import type { QadrUse, SavedState } from '../types';

/**
 * Laylatul Qadr mode rules:
 * - only in the last ten nights of Ramadan (Maghrib of the 20th to Fajr),
 * - only one night per Hijri year,
 * - the ×1000 multiplier ends at Fajr of that night.
 */

type Coords = NonNullable<SavedState['coords']>;

export interface HijriDate {
  year: number;
  month: number;
  day: number;
}

let hijriFormat: Intl.DateTimeFormat | null = null;

export function hijriDate(date: Date): HijriDate {
  if (!hijriFormat) {
    hijriFormat = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    if (!hijriFormat.resolvedOptions().calendar.startsWith('islamic')) {
      hijriFormat = new Intl.DateTimeFormat('en-u-ca-islamic-nu-latn', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
    }
  }
  const parts = hijriFormat.formatToParts(date);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
  return { year: get('year'), month: get('month'), day: get('day') };
}

function atHour(date: Date, hour: number): Date {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Fajr and Maghrib for the calendar day of `date`. Without a location, 05:00 and 18:00. */
export function prayerTimes(date: Date, coords: Coords | null): { fajr: Date; maghrib: Date } {
  const fallback = { fajr: atHour(date, 5), maghrib: atHour(date, 18) };
  if (!coords) return fallback;
  try {
    const times = new PrayerTimes(
      new Coordinates(coords.lat, coords.lng),
      date,
      CalculationMethod.MuslimWorldLeague()
    );
    const valid = (d: Date) => d instanceof Date && !Number.isNaN(d.getTime());
    return {
      fajr: valid(times.fajr) ? times.fajr : fallback.fajr,
      maghrib: valid(times.maghrib) ? times.maghrib : fallback.maghrib,
    };
  } catch {
    return fallback;
  }
}

export type QadrStatus =
  | { kind: 'active'; expiresAt: number }
  | { kind: 'available'; expiresAt: number; hijriYear: number }
  | { kind: 'used'; hijriYear: number }
  | { kind: 'daytime' }
  | { kind: 'closed' };

export function qadrStatus(now: Date, used: QadrUse | null, coords: Coords | null): QadrStatus {
  const h = hijriDate(now);
  if (used && used.hijriYear === h.year) {
    return now.getTime() < used.expiresAt
      ? { kind: 'active', expiresAt: used.expiresAt }
      : { kind: 'used', hijriYear: used.hijriYear };
  }

  const today = prayerTimes(now, coords);
  const ramadan = h.month === 9;

  // Evening: the night of the 21st starts at Maghrib on the 20th.
  if (now >= today.maghrib && ramadan && h.day >= 20) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      kind: 'available',
      hijriYear: h.year,
      expiresAt: prayerTimes(tomorrow, coords).fajr.getTime(),
    };
  }
  // After midnight, before Fajr: still the same night. Shawwal 1 before Fajr is
  // allowed too, as a one-day tolerance for local moon sighting.
  if (now < today.fajr && ((ramadan && h.day >= 21) || (h.month === 10 && h.day === 1))) {
    return { kind: 'available', hijriYear: h.year, expiresAt: today.fajr.getTime() };
  }

  if (ramadan && h.day >= 20) return { kind: 'daytime' };
  return { kind: 'closed' };
}

/** Asks for the device location once (rounded to ~1 km for privacy). */
export function requestCoords(timeoutMs = 8000): Promise<Coords | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lng: Math.round(pos.coords.longitude * 100) / 100,
        }),
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 7 * 24 * 3600 * 1000 }
    );
  });
}

const pageLoadedAt = Date.now();

/** Current time; `?now=2027-03-08T21:00` overrides it in dev builds for testing. */
export function appNow(): Date {
  if (import.meta.env.DEV) {
    const override = new URLSearchParams(window.location.search).get('now');
    if (override) {
      const fixed = new Date(override);
      if (!Number.isNaN(fixed.getTime())) {
        // Advance from the override at real speed so countdowns still tick.
        const offset = fixed.getTime() - pageLoadedAt;
        return new Date(Date.now() + offset);
      }
    }
  }
  return new Date();
}

export function formatCountdown(ms: number): string {
  const totalMin = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
