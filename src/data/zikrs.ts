import type { Milestones, Zikr } from '../types';

export const ZIKRS: Zikr[] = [
  {
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    translit: 'Subḥānallāhi wa biḥamdihī',
    meaning: '"Glory be to Allah and all praise is due to Him"',
    trees: 1,
  },
  {
    arabic: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَٰهَه إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ',
    translit: 'Subḥānallāhi walḥamdulillāhi walā ilāha illallāhu wallāhu Akbar',
    meaning: '"Glory be to Allah, praise to Allah, none worthy of worship but Allah, Allah is Greatest"',
    trees: 4,
  },
];

export const MILESTONES: Milestones = {
  10: '🌿 10 trees! Your garden in Jannah is sprouting!',
  25: '🌳 25 trees! MashaAllah, a beautiful grove!',
  50: '🌲 50 trees! SubhanAllah, a forest is growing!',
  100: '✨ 100 trees! What a magnificent garden!',
  250: '💫 250 trees! The angels are amazed!',
  500: '🏡 500 trees! Your palace in Jannah is surrounded!',
  1000: '👑 1,000 trees! MashaAllah — a paradise!',
  5000: '🌌 5,000 trees! An entire realm of Jannah!',
  10000: '🕌 10,000 trees! A sanctuary beyond imagination!',
  100000: '🌠 100,000 trees! The heavens take notice!',
  1000000: '🌍 1,000,000 trees! A world of blessings planted!',
  10000000: '☀️ 10,000,000 trees! Light fills every corner of Jannah!',
  100000000: '🌊 100,000,000 trees! Rivers of mercy flow between them!',
  1000000000: '🌙 1,000,000,000 trees! A billion prayers answered!',
  10000000000: '⭐ 10,000,000,000 trees! Stars bow to your garden!',
  100000000000: '🪐 100,000,000,000 trees! Galaxies of gratitude!',
  1000000000000: '♾️ 1,000,000,000,000 trees! Only Allah can count your reward!',
};

/** Sorted milestone thresholds, ascending — used to detect which one was just crossed. */
export const MILESTONE_THRESHOLDS = Object.keys(MILESTONES)
  .map(Number)
  .sort((a, b) => a - b);
