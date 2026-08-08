import type { EffectiveTimeOfDay } from '../../types';
import styles from './Panel.module.css';

interface SunProps {
  mode: EffectiveTimeOfDay;
}

export default function Sun({ mode }: SunProps) {
  const isMorning = mode === 'morning';
  return (
    <div className={`${styles.sun} ${isMorning ? styles.sunMorning : styles.sunAfternoon}`}>
      {/* Outer glow ring */}
      <div className={styles.sunGlow} />
      {/* Inner core */}
      <div className={styles.sunCore} />
      {/* Rays */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={styles.sunRay}
          style={{ '--ray-angle': `${i * 45}deg` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
