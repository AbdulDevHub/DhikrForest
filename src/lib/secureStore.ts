import type { ForestSegment, SavedState } from '../types';
import { QADR_MULTIPLIER, STORAGE_KEYS } from '../utils/constants';
import { appendTrees, isValidSegments, totalValue } from './forestSegments';

/**
 * Signed local storage.
 *
 * The whole app state is saved as one JSON blob next to a keyed hash of it.
 * Editing the value in DevTools breaks the hash, so on the next load we fall
 * back to the backup copy (or a fresh forest) instead of trusting it.
 *
 * This is tamper-evidence, not real security: the key ships with the page, so
 * a determined person can still forge it. The public leaderboard does not
 * trust this data at all; Firestore security rules check it server-side.
 */

const SECRET = 'dhikrforest·jannah·v3·7f3a9c51';

function cyrb53(str: string, seed: number): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function sign(payload: string, deviceId: string): string {
  const input = `${SECRET}|${deviceId}|${payload}`;
  return cyrb53(input, 0x9e37).toString(36) + '.' + cyrb53(input, 0x85eb).toString(36);
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function defaultState(): SavedState {
  return {
    v: 3,
    segments: [],
    daily: { day: todayKey(), count: 0 },
    streak: { count: 0, lastGoalDay: null },
    goal: 100,
    qadr: null,
    pending: {},
    resetAt: 0,
    haptics: true,
    coords: null,
  };
}

const isNonNegInt = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
const isDay = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Shape check: a correctly signed blob from an older build still has to look right. */
function sanitize(raw: unknown): SavedState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<SavedState>;
  if (r.v !== 3 || !isValidSegments(r.segments)) return null;
  if (!r.daily || !isDay(r.daily.day) || !isNonNegInt(r.daily.count)) return null;
  if (!r.streak || !isNonNegInt(r.streak.count)) return null;
  if (r.streak.lastGoalDay !== null && !isDay(r.streak.lastGoalDay)) return null;
  if (!isNonNegInt(r.goal) || r.goal === 0) return null;
  const qadr = r.qadr ?? null;
  if (qadr && !(isNonNegInt(qadr.hijriYear) && isNonNegInt(qadr.expiresAt) && isNonNegInt(qadr.activatedAt))) {
    return null;
  }
  const pending = r.pending ?? {};
  if (typeof pending !== 'object' || !Object.values(pending).every(isNonNegInt)) return null;
  const resetAt = r.resetAt ?? 0;
  if (!isNonNegInt(resetAt)) return null;
  const coords = r.coords ?? null;
  if (coords && !(Number.isFinite(coords.lat) && Number.isFinite(coords.lng))) return null;
  return {
    v: 3,
    segments: r.segments,
    daily: r.daily,
    streak: r.streak,
    goal: r.goal,
    qadr,
    pending,
    resetAt,
    haptics: r.haptics !== false,
    coords,
  };
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota or private mode: state still lives in memory for this visit */
  }
}

function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function getDeviceId(): { id: string; existed: boolean } {
  const existing = safeGet(STORAGE_KEYS.device);
  if (existing && /^[\w-]{8,64}$/.test(existing)) return { id: existing, existed: true };
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  safeSet(STORAGE_KEYS.device, id);
  return { id, existed: false };
}

type ReadResult = { kind: 'missing' } | { kind: 'invalid' } | { kind: 'ok'; state: SavedState };

/** Parses one stored blob. Exported for the cross-tab `storage` listener. */
export function parseSigned(raw: string | null, deviceId: string): ReadResult {
  if (raw === null) return { kind: 'missing' };
  try {
    const parsed = JSON.parse(raw) as { d?: unknown; s?: unknown };
    if (typeof parsed.s !== 'string') return { kind: 'invalid' };
    const payload = JSON.stringify(parsed.d);
    if (sign(payload, deviceId) !== parsed.s) return { kind: 'invalid' };
    const state = sanitize(parsed.d);
    return state ? { kind: 'ok', state } : { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

/** One-time import from the pre-v3 format (one JSON object per tree). */
function migrateLegacy(): SavedState | null {
  const itemsRaw = safeGet(STORAGE_KEYS.legacyTreeItems);
  const countRaw = safeGet(STORAGE_KEYS.legacyTreeCount);
  const totalRaw = safeGet(STORAGE_KEYS.legacyTotalTrees);
  if (itemsRaw === null && countRaw === null && totalRaw === null) return null;

  let segments: ForestSegment[] = [];
  try {
    const items = itemsRaw ? (JSON.parse(itemsRaw) as { type?: string }[]) : null;
    if (Array.isArray(items)) {
      for (const item of items) {
        segments = appendTrees(segments, item?.type === 'qadr' ? 'qadr' : 'standard', 1);
      }
    } else if (countRaw) {
      segments = appendTrees(segments, 'standard', Math.max(0, parseInt(countRaw, 10) || 0));
    }
  } catch {
    /* unreadable legacy items: fall through with whatever total we have */
  }

  // Older builds tracked the total separately from the visible trees; keep it intact.
  const legacyTotal = Math.max(0, parseInt(totalRaw ?? '', 10) || 0);
  const missing = legacyTotal - totalValue(segments);
  if (missing > 0) {
    segments = appendTrees(segments, 'qadr', Math.floor(missing / QADR_MULTIPLIER));
    segments = appendTrees(segments, 'standard', missing % QADR_MULTIPLIER);
  }

  for (const key of [
    STORAGE_KEYS.legacyTreeItems,
    STORAGE_KEYS.legacyTreeCount,
    STORAGE_KEYS.legacyTotalTrees,
    STORAGE_KEYS.legacyPositions,
  ]) {
    safeRemove(key);
  }
  return { ...defaultState(), segments };
}

export interface LoadResult {
  state: SavedState;
  /** Saved data failed its signature check and was replaced. */
  tampered: boolean;
}

export function loadState(): LoadResult {
  const device = getDeviceId();
  const main = parseSigned(safeGet(STORAGE_KEYS.state), device.id);
  if (main.kind === 'ok') return { state: main.state, tampered: false };

  const backup = parseSigned(safeGet(STORAGE_KEYS.stateBackup), device.id);
  if (backup.kind === 'ok') {
    saveState(backup.state);
    return { state: backup.state, tampered: main.kind === 'invalid' };
  }

  if (main.kind === 'invalid' || backup.kind === 'invalid') {
    // Both copies were edited. Start over rather than trust either.
    const fresh = defaultState();
    saveState(fresh);
    return { state: fresh, tampered: true };
  }

  // Nothing saved yet. Only a brand-new device may import legacy keys, so the
  // old unsigned format can't be used to inject trees later.
  const migrated = device.existed ? null : migrateLegacy();
  const state = migrated ?? defaultState();
  saveState(state);
  return { state, tampered: false };
}

export function saveState(state: SavedState) {
  const { id } = getDeviceId();
  const payload = JSON.stringify(state);
  const blob = JSON.stringify({ d: state, s: sign(payload, id) });
  safeSet(STORAGE_KEYS.state, blob);
  safeSet(STORAGE_KEYS.stateBackup, blob);
}

export function currentDeviceId(): string {
  return getDeviceId().id;
}
