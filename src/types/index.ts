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

export type TreeItem = {
  id: number;
  type: TreeType;
};

export type TimeOfDayMode = 'auto' | 'morning' | 'afternoon' | 'night';
export type EffectiveTimeOfDay = 'morning' | 'afternoon' | 'night' | 'qadr';

