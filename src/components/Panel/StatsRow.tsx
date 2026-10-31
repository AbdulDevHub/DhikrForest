import styles from './Panel.module.css';

interface StatsRowProps {
  sessionCount: number;
  todayCount: number;
  goal: number;
  streak: number;
}

export default function StatsRow({ sessionCount, todayCount, goal, streak }: StatsRowProps) {
  const pct = Math.min(100, (todayCount / goal) * 100);
  return (
    <div className={styles.statsRow}>
      <div className={styles.statBox} title="Dhikr recited today vs. your daily goal">
        <div className={styles.statLabel}>Today</div>
        <div className={styles.statVal}>
          {todayCount.toLocaleString()}
          <span className={styles.statOf}>/{goal}</span>
        </div>
        <div className={styles.statBar} aria-hidden="true">
          <div className={styles.statBarFill} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className={styles.statBox} title="Days in a row you reached your daily goal">
        <div className={styles.statLabel}>Streak</div>
        <div className={styles.statVal}>
          {streak > 0 ? '🔥 ' : ''}
          {streak}
        </div>
      </div>
      <div className={styles.statBox} title="Trees planted since you opened the app">
        <div className={styles.statLabel}>Session</div>
        <div className={styles.statVal}>{sessionCount.toLocaleString()}</div>
      </div>
    </div>
  );
}
