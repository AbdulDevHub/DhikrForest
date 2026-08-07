import { forwardRef } from 'react';
import styles from './Panel.module.css';

interface PlantButtonProps {
  onPlant: () => void;
}

const PlantButton = forwardRef<HTMLButtonElement, PlantButtonProps>(function PlantButton(
  { onPlant },
  ref
) {
  return (
    <button ref={ref} className={styles.zikrBtn} onClick={onPlant}>
      🌱 Plant a Tree
      <span className={styles.hint}>Press Enter or Space</span>
    </button>
  );
});

export default PlantButton;
