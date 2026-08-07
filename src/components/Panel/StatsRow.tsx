import styles from './Panel.module.css';

interface StatsRowProps {
  sessionCount: number;
  rows: number;
}

export default function StatsRow({ sessionCount, rows }: StatsRowProps) {
  return (
    <div className={styles.statsRow}>
      <div className={styles.statBox}>
        <div className={styles.statLabel}>Session</div>
        <div className={styles.statVal}>{sessionCount.toLocaleString()}</div>
      </div>
      <div className={styles.statBox}>
        <div className={styles.statLabel}>Rows</div>
        <div className={styles.statVal}>{rows.toLocaleString()}</div>
      </div>
    </div>
  );
}
