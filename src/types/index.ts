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
