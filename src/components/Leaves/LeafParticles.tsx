import type { CSSProperties } from 'react';
import type { LeafParticle } from '../../types';
import styles from './Leaves.module.css';

interface LeafParticlesProps {
  leaves: LeafParticle[];
}

export default function LeafParticles({ leaves }: LeafParticlesProps) {
  return (
    <>
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className={styles.leafParticle}
          style={
            {
              left: leaf.left,
              top: leaf.top,
              '--lx': `${leaf.lx}px`,
              '--ly': `${leaf.ly}px`,
              '--lr': `${leaf.lr}deg`,
              animationDelay: `${leaf.delay}s`,
            } as CSSProperties
          }
        >
          {leaf.emoji}
        </div>
      ))}
    </>
  );
}
