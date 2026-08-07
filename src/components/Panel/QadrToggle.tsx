import styles from './Panel.module.css';

interface QadrToggleProps {
  qadrOn: boolean;
  onToggle: () => void;
}

export default function QadrToggle({ qadrOn, onToggle }: QadrToggleProps) {
  return (
    <div
      role="switch"
      aria-checked={qadrOn}
      tabIndex={0}
      className={`${styles.qadrToggle} ${qadrOn ? styles.qadrToggleActive : ''}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onToggle();
      }}
    >
      <div className={styles.togglePill}>
        <div className={styles.toggleKnob} />
      </div>
      <span className={styles.qadrLabel}>🌙 Laylatul Qadr</span>
      <span className={styles.qadrMult}>×1000</span>
    </div>
  );
}
