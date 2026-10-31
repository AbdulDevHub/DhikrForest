export interface Zikr {
  arabic: string;
  translit: string;
  meaning: string;
  trees: number;
}

export type Milestones = Record<number, string>;

export interface LeafParticle {
  id: number;
  emoji: string;
  left: number;
  top: number;
  lx: number;
  ly: number;
  lr: number;
  delay: number;
}

export interface TreePalette {
  top: string;
  mid: string;
  bot: string;
}

export type TreeType = 'standard' | 'qadr';

/** Run-length encoded run of identical trees: `n` trees of type `t`. */
export interface ForestSegment {
  t: TreeType;
  n: number;
}

/** The one Laylatul Qadr night used this Hijri year. */
export interface QadrUse {
  hijriYear: number;
  activatedAt: number;
  /** Fajr of that night (epoch ms); the multiplier switches off here. */
  expiresAt: number;
}

/** Everything the app keeps on the device, saved as one signed blob. */
export interface SavedState {
  v: 3;
  segments: ForestSegment[];
  /** Dhikr recitations (clicks) today, keyed by local date `YYYY-MM-DD`. */
  daily: { day: string; count: number };
  streak: { count: number; lastGoalDay: string | null };
  goal: number;
  qadr: QadrUse | null;
  /** Trees planted while signed in that haven't reached the leaderboard yet, per account uid. */
  pending: Record<string, number>;
  /** When the forest was last reset (epoch ms); the newer reset wins when merging with the cloud copy. */
  resetAt: number;
  haptics: boolean;
  /** Rounded coordinates used for Fajr/Maghrib times, cached after first ask. */
  coords: { lat: number; lng: number } | null;
}

export type TimeOfDayMode = 'auto' | 'morning' | 'afternoon' | 'night';
export type EffectiveTimeOfDay = 'morning' | 'afternoon' | 'night' | 'qadr';
