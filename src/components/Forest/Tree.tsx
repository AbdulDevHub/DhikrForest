import { memo } from 'react';
import type { TreeItem } from '../../types';
import styles from './Forest.module.css';

interface TreeProps {
  item: TreeItem;
  animate: boolean;
}

function Tree({ item, animate }: TreeProps) {
  const isQadr = item.type === 'qadr';

  return (
    <div className={`${styles.gridSlot} ${animate ? styles.treeGrowAnim : ''}`}>
      <div className={`${styles.treeTopView} ${isQadr ? styles.treeQadr : styles.treeStandard}`}>
        {/* Canopy SVG */}
        <svg viewBox="0 0 100 100" className={styles.treeSvg}>
          <defs>
            {/* Standard Canopy Gradient */}
            <radialGradient id="stdCanopy" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="50%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#064e3b" />
            </radialGradient>

            {/* Qadr Golden-Emerald Canopy Gradient */}
            <radialGradient id="qadrCanopy" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#064e3b" />
            </radialGradient>

            {/* Drop Shadow */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Base Shadow */}
          <circle cx="50" cy="50" r="42" fill="none" filter="url(#shadow)" />

          {/* Outer Layer */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill={isQadr ? 'url(#qadrCanopy)' : 'url(#stdCanopy)'}
          />

          {/* Inner Foliage Details */}
          <circle cx="42" cy="42" r="26" fill="rgba(255, 255, 255, 0.18)" />
          <circle cx="58" cy="46" r="20" fill="rgba(0, 0, 0, 0.12)" />
          <circle cx="48" cy="58" r="22" fill="rgba(0, 0, 0, 0.15)" />
          <circle cx="36" cy="36" r="14" fill="rgba(255, 255, 255, 0.28)" />

          {/* Qadr Sparkle Accents */}
          {isQadr && (
            <>
              <circle cx="32" cy="30" r="2.5" fill="#ffffff" />
              <circle cx="68" cy="40" r="3" fill="#fef08a" />
              <circle cx="50" cy="70" r="2" fill="#ffffff" />
            </>
          )}
        </svg>

        {/* Hover Tooltip for Special Qadr Trees */}
        {isQadr && <div className={styles.qadrTooltip}>x1000</div>}
      </div>
    </div>
  );
}

export default memo(Tree);
