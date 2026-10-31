import { ZIKRS } from '../../data/zikrs';
import styles from './Panel.module.css';

interface ZikrNavProps {
  currentZikr: number;
  onSelect: (index: number) => void;
}

export default function ZikrNav({ currentZikr, onSelect }: ZikrNavProps) {
  return (
    <div className={styles.zikrNav} role="tablist" aria-label="Choose dhikr">
      {ZIKRS.map((z, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === currentZikr}
          aria-label={z.translit}
          title={z.translit}
          className={`${styles.zikrDot} ${i === currentZikr ? styles.zikrDotActive : ''}`}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}
