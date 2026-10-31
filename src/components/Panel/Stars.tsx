import styles from './Panel.module.css';

/**
 * 120 stars drawn as box-shadows on three 1px layers. Each layer twinkles by
 * fading its opacity, so the browser runs 3 cheap compositor animations
 * instead of 120 separate ones.
 */
const LAYERS = 3;
const PER_LAYER = 40;

function starField(seed: number): string {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const shadows: string[] = [];
  for (let i = 0; i < PER_LAYER; i++) {
    const x = (rand() * 100).toFixed(2);
    const y = (rand() * 92).toFixed(2);
    const size = rand() < 0.2 ? 1 : 0;
    const alpha = (0.5 + rand() * 0.5).toFixed(2);
    // cqw/cqh: percent of the star container, which fills the panel.
    shadows.push(`${x}cqw ${y}cqh 0 ${size}px rgba(255,255,255,${alpha})`);
  }
  return shadows.join(',');
}

const FIELDS = Array.from({ length: LAYERS }, (_, i) => starField(1234 + i * 977));

export default function Stars() {
  return (
    <div className={styles.stars} aria-hidden="true">
      {FIELDS.map((shadow, i) => (
        <div
          key={i}
          className={styles.starLayer}
          style={{ boxShadow: shadow, animationDelay: `${i * -1.7}s`, animationDuration: `${3.2 + i * 1.3}s` }}
        />
      ))}
    </div>
  );
}
