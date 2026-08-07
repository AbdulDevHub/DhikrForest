import { useMemo } from 'react';
import styles from './Panel.module.css';

interface StarStyle {
  key: number;
  size: number;
  left: number;
  top: number;
  duration: string;
  o1: string;
  o2: string;
  delay: string;
}

const STAR_COUNT = 120;

export default function Stars() {
  const stars = useMemo<StarStyle[]>(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        key: i,
        size: Math.random() * 2 + 0.4,
        left: Math.random() * 100,
        top: Math.random() * 90,
        duration: (Math.random() * 4 + 1.5).toFixed(1) + 's',
        o1: (Math.random() * 0.4 + 0.12).toFixed(2),
        o2: (Math.random() * 0.4 + 0.6).toFixed(2),
        delay: (Math.random() * 5).toFixed(2) + 's',
      })),
    []
  );

  return (
    <>
      {stars.map((s) => (
        <div
          key={s.key}
          className={styles.star}
          style={
            {
              width: s.size,
              height: s.size,
              left: `${s.left}%`,
              top: `${s.top}%`,
              '--d': s.duration,
              '--o1': s.o1,
              '--o2': s.o2,
              animationDelay: s.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}
