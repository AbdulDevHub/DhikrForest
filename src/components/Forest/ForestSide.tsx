import { useEffect, useRef, useState } from 'react';
import { COLS } from '../../utils/constants';
import { canvasHeightPx, scrollTargetPx } from '../../utils/geometry';
import ForestCanvas from './ForestCanvas';
import ScrollHint from './ScrollHint';
import Flash from './Flash';
import styles from './Forest.module.css';

interface ForestSideProps {
  treeCount: number;
  scrollKey: number;
  flashKey: number;
}

export default function ForestSide({ treeCount, scrollKey, flashKey }: ForestSideProps) {
  const sideRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const hasMountedRef = useRef(false);

  // Track the container's height so we know how far to scroll and whether
  // the "scroll to see older trees" hint should show.
  useEffect(() => {
    const el = sideRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    observer.observe(el);
    setContainerHeight(el.clientHeight);
    return () => observer.disconnect();
  }, []);

  // Scroll to the latest row: instantly on first load, smoothly afterwards.
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || containerHeight === 0) return;
    const target = scrollTargetPx(treeCount, containerHeight);
    scrollEl.scrollTo({ top: target, behavior: hasMountedRef.current ? 'smooth' : 'instant' });
    hasMountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey, containerHeight]);

  const hintVisible = treeCount > COLS && canvasHeightPx(treeCount) > containerHeight;

  return (
    <div ref={sideRef} className={styles.forestSide}>
      <div ref={scrollRef} className={styles.forestScroll}>
        <ForestCanvas treeCount={treeCount} />
      </div>
      <ScrollHint visible={hintVisible} />
      <Flash flashKey={flashKey} />
    </div>
  );
}
