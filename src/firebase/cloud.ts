/**
 * Everything that talks to Firebase. This module is only loaded with a
 * dynamic `import()`, so the SDK never slows down the first paint.
 */
import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  getAggregateFromServer,
  getCountFromServer,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  sum,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { ForestSegment, SavedState } from '../types';
import { QADR_MULTIPLIER } from '../utils/constants';
import { firebaseConfig } from './config';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Memory cache on purpose: sync amounts are tracked in our own signed state,
// so a write queued in IndexedDB and replayed next visit would double count.
const db = getFirestore(app);

export interface CloudUser {
  uid: string;
  photoURL: string | null;
}

export interface Profile {
  nickname: string;
  total: number;
  weekTotal: number;
  weekIndex: number;
  lastSync: number;
  qadrActivatedAt: number | null;
  qadrExpiresAt: number | null;
}

export interface LeaderRow {
  uid: string;
  nickname: string;
  score: number;
}

export type Period = 'week' | 'all';

/** Must match currentWeek() in firestore.rules: weeks start Monday 00:00 UTC. */
export function weekIndexOf(ms: number): number {
  return Math.floor((ms + 259200000) / 604800000);
}

const millis = (v: unknown): number | null => (v instanceof Timestamp ? v.toMillis() : null);

export function watchAuth(cb: (user: CloudUser | null) => void): () => void {
  return onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, photoURL: u.photoURL } : null));
}

export async function signIn(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    const code = (err as { code?: string }).code;
    // Installed PWAs and some mobile browsers block popups.
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return;
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
    throw err;
  }
}

export function signOut(): Promise<void> {
  return fbSignOut(auth);
}

export function watchProfile(uid: string, cb: (p: Profile | null) => void): () => void {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (!snap.exists()) return cb(null);
    const d = snap.data();
    cb({
      nickname: d.nickname,
      total: d.total ?? 0,
      weekTotal: d.weekTotal ?? 0,
      weekIndex: d.weekIndex ?? 0,
      lastSync: millis(d.lastSync) ?? Date.now(),
      qadrActivatedAt: millis(d.qadrActivatedAt),
      qadrExpiresAt: millis(d.qadrExpiresAt),
    });
  });
}

export function createProfile(uid: string, nickname: string): Promise<void> {
  return setDoc(doc(db, 'users', uid), {
    nickname,
    total: 0,
    weekTotal: 0,
    weekIndex: weekIndexOf(Date.now()),
    lastSync: serverTimestamp(),
    createdAt: serverTimestamp(),
    qadrActivatedAt: null,
    qadrExpiresAt: null,
  });
}

export function renameProfile(uid: string, nickname: string): Promise<void> {
  return updateDoc(doc(db, 'users', uid), { nickname });
}

/** Rough mirror of the rules' allowance, so we don't send writes that get rejected. */
function allowance(profile: Profile, now: number): number {
  const mult =
    profile.qadrExpiresAt !== null && now < profile.qadrExpiresAt + 24 * 3600 * 1000 ? QADR_MULTIPLIER : 1;
  // Leave 2 s of slack for clock skew between this device and the server.
  const elapsedSec = Math.max(0, (now - profile.lastSync) / 1000 - 2);
  return Math.floor(Math.min(elapsedSec * 16 + 16, 5000) * mult);
}

/**
 * Adds up to `amount` trees to the leaderboard. Returns how many were sent;
 * the caller keeps the rest pending for the next sync.
 */
export async function pushTrees(uid: string, amount: number, profile: Profile): Promise<number> {
  const now = Date.now();
  if (now - profile.lastSync < 6000) return 0;
  const delta = Math.min(amount, allowance(profile, now));
  if (delta <= 0) return 0;
  const week = weekIndexOf(now);
  await updateDoc(doc(db, 'users', uid), {
    total: increment(delta),
    weekTotal: week === profile.weekIndex ? increment(delta) : delta,
    weekIndex: week,
    lastSync: serverTimestamp(),
  });
  return delta;
}

export function activateQadr(uid: string, expiresAt: number): Promise<void> {
  return updateDoc(doc(db, 'users', uid), {
    qadrActivatedAt: serverTimestamp(),
    qadrExpiresAt: Timestamp.fromMillis(expiresAt),
  });
}

export interface CloudForest {
  segments: ForestSegment[];
  goal: number;
  streak: SavedState['streak'];
  daily: SavedState['daily'];
  /** Missing on backups written before resets were tracked. */
  resetAt?: number;
}

export async function loadForest(uid: string): Promise<CloudForest | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'private', 'forest'));
  return snap.exists() ? (snap.data() as CloudForest) : null;
}

export function saveForest(uid: string, forest: CloudForest): Promise<void> {
  return setDoc(doc(db, 'users', uid, 'private', 'forest'), {
    ...forest,
    updatedAt: serverTimestamp(),
  });
}

const scoreField = (period: Period) => (period === 'week' ? 'weekTotal' : 'total');

function boardQuery(period: Period) {
  const users = collection(db, 'users');
  return period === 'week'
    ? query(users, where('weekIndex', '==', weekIndexOf(Date.now())), orderBy('weekTotal', 'desc'))
    : query(users, orderBy('total', 'desc'));
}

export async function fetchLeaderboard(period: Period, size = 50): Promise<LeaderRow[]> {
  const snap = await getDocs(query(boardQuery(period), limit(size)));
  return snap.docs
    .map((d) => ({ uid: d.id, nickname: d.get('nickname') as string, score: d.get(scoreField(period)) as number }))
    .filter((r) => r.score > 0);
}

/** 1-based rank of a score (ties share the better rank). */
export async function fetchRank(period: Period, score: number): Promise<number> {
  const field = scoreField(period);
  const users = collection(db, 'users');
  const q =
    period === 'week'
      ? query(users, where('weekIndex', '==', weekIndexOf(Date.now())), where(field, '>', score))
      : query(users, where(field, '>', score));
  const snap = await getCountFromServer(q);
  return snap.data().count + 1;
}

export async function fetchCommunity(): Promise<{ trees: number; people: number }> {
  const snap = await getAggregateFromServer(collection(db, 'users'), {
    trees: sum('total'),
  });
  const people = await getCountFromServer(query(collection(db, 'users'), where('total', '>', 0)));
  return { trees: snap.data().trees ?? 0, people: people.data().count };
}
