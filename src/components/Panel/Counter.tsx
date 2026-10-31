import styles from './Panel.module.css';

interface CounterProps {
  totalTrees: number;
  bumpKey: number;
}

export default function Counter({ totalTrees, bumpKey }: CounterProps) {
  return (
    <div className={styles.counterBlock}>
      <div className={styles.counterIcon} aria-hidden="true">🌳</div>
      <div className={styles.counterLabel} id="counter-label">Trees in Jannah</div>
      {/* Changing `key` remounts the node so the bump keyframe replays each plant */}
      <div aria-live="polite" aria-labelledby="counter-label">
        <div key={bumpKey} className={styles.treeCountDisplay}>
          {totalTrees.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
