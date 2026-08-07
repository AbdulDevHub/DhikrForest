import { ZIKRS } from '../../data/zikrs';
import styles from './Panel.module.css';

interface ZikrNavProps {
  currentZikr: number;
  onSelect: (index: number) => void;
}

export default function ZikrNav({ currentZikr, onSelect }: ZikrNavProps) {
  return (
    <div className={styles.zikrNav}>
      {ZIKRS.map((_, i) => (
        <div
          key={i}
          role="button"
          aria-label={`Select dhikr ${i + 1}`}
          tabIndex={0}
          className={`${styles.zikrDot} ${i === currentZikr ? styles.zikrDotActive : ''}`}
          onClick={() => onSelect(i)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSelect(i);
          }}
        />
      ))}
    </div>
  );
}
