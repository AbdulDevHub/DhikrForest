import type { TimeOfDayMode } from '../../types';
import styles from './Panel.module.css';

interface TimeSelectorProps {
  timeMode: TimeOfDayMode;
  onChange: (mode: TimeOfDayMode) => void;
}

const OPTIONS: { mode: TimeOfDayMode; label: string; icon: string }[] = [
  { mode: 'auto',      label: 'Auto',    icon: '🕒' },
  { mode: 'morning',   label: 'Dawn',    icon: '🌅' },
  { mode: 'afternoon', label: 'Day',     icon: '☀️' },
  { mode: 'night',     label: 'Night',   icon: '🌙' },
];

export default function TimeSelector({ timeMode, onChange }: TimeSelectorProps) {
  return (
    <div className={styles.timeSelector} role="group" aria-label="Time of day appearance">
      {OPTIONS.map(({ mode, label, icon }) => (
        <button
          key={mode}
          id={`time-mode-${mode}`}
          type="button"
          className={`${styles.timeSelectorBtn} ${timeMode === mode ? styles.timeSelectorBtnActive : ''}`}
          onClick={() => onChange(mode)}
          aria-pressed={timeMode === mode}
          title={label}
        >
          <span className={styles.timeSelectorIcon}>{icon}</span>
          <span className={styles.timeSelectorLabel}>{label}</span>
        </button>
      ))}
    </div>
  );
}
