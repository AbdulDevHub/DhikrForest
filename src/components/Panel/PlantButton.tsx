import { forwardRef } from 'react';
import type { MouseEvent } from 'react';
import styles from './Panel.module.css';

interface PlantButtonProps {
  onPlant: (e: MouseEvent<HTMLButtonElement>) => void;
}

const PlantButton = forwardRef<HTMLButtonElement, PlantButtonProps>(function PlantButton(
  { onPlant },
  ref
) {
  return (
    <button ref={ref} type="button" className={styles.zikrBtn} onClick={onPlant}>
      🌱 Plant a Tree
      <span className={styles.hint}>Tap, or press Enter / Space</span>
    </button>
  );
});

export default PlantButton;
