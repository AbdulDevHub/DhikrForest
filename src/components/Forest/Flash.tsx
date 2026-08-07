import styles from './Forest.module.css';

interface FlashProps {
  flashKey: number;
}

export default function Flash({ flashKey }: FlashProps) {
  // Nothing has been planted yet — don't play the pulse on initial load.
  if (flashKey === 0) return null;
  // Remounting via `key` replays the CSS keyframe each time flashKey changes.
  return <div key={flashKey} className={styles.flash} />;
}
