import type { Zikr } from '../../types';
import styles from './Panel.module.css';

interface ZikrBlockProps {
  zikr: Zikr;
  qadrOn: boolean;
}

export default function ZikrBlock({ zikr, qadrOn }: ZikrBlockProps) {
  const total = zikr.trees * (qadrOn ? 1000 : 1);
  const treesPerClickLabel = qadrOn
    ? `🌙 ×1000 — ${total.toLocaleString()} trees per click!`
    : `🌱 Plants ${zikr.trees} tree${zikr.trees > 1 ? 's' : ''} per click`;

  return (
    <div className={styles.zikrBlock}>
      <div className={styles.arabicText}>{zikr.arabic}</div>
      <div className={styles.transliteration}>{zikr.translit}</div>
      <div className={styles.meaning}>{zikr.meaning}</div>
      <div className={styles.treesPerClick}>{treesPerClickLabel}</div>
    </div>
  );
}
