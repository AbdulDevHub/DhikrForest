import { useEffect, useRef } from 'react';
import { VISUAL_CAP } from '../../utils/constants';
import { canvasHeightPx } from '../../utils/geometry';
import Tree from './Tree';
import styles from './Forest.module.css';

interface ForestCanvasProps {
  treeCount: number;
}

export default function ForestCanvas({ treeCount }: ForestCanvasProps) {
  // Tracks the tree count as of the previous render, so only indices added
  // since then play the "grow" animation; everything already on screen —
  // including trees restored from localStorage on first load — stays put.
  const prevTreeCountRef = useRef(treeCount);
  useEffect(() => {
    prevTreeCountRef.current = treeCount;
  }, [treeCount]);

  const visibleStart = Math.max(0, treeCount - VISUAL_CAP);
  const newSince = prevTreeCountRef.current;

  const indices: number[] = [];
  for (let i = visibleStart; i < treeCount; i++) indices.push(i);

  return (
    <div className={styles.forestCanvas} style={{ height: canvasHeightPx(treeCount) }}>
      {indices.map((idx) => (
        <Tree key={idx} idx={idx} treeCount={treeCount} animate={idx >= newSince} />
      ))}
    </div>
  );
}
