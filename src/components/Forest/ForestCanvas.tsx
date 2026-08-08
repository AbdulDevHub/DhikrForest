import { useEffect, useRef } from 'react';
import type { TreeItem } from '../../types';
import Tree from './Tree';
import styles from './Forest.module.css';

interface ForestCanvasProps {
  items: TreeItem[];
}

export default function ForestCanvas({ items }: ForestCanvasProps) {
  const prevCountRef = useRef(items.length);

  useEffect(() => {
    prevCountRef.current = items.length;
  }, [items.length]);

  const prevCount = prevCountRef.current;

  return (
    <div className={styles.forestGrid}>
      {items.map((item, idx) => (
        <Tree key={item.id} item={item} animate={idx >= prevCount} />
      ))}
    </div>
  );
}
