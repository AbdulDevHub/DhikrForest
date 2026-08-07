import { memo } from 'react';
import { column, logicalRow, treeScale, treeTopPx, treeXpct } from '../../utils/geometry';
import { buildTreeShape } from '../../utils/treeShape';
import styles from './Forest.module.css';

interface TreeProps {
  idx: number;
  treeCount: number;
  animate: boolean;
}

function Tree({ idx, treeCount, animate }: TreeProps) {
  const scale = treeScale(idx);
  const col = column(idx);
  const logRow = logicalRow(idx);
  const x = treeXpct(col);
  const top = treeTopPx(logRow, scale, treeCount);
  const shape = buildTreeShape(idx, scale);
  const zIndex = Math.round(scale * 8 + logRow * 0.4);

  return (
    <div
      className={styles.treeWrap}
      style={{ left: `${x}%`, top, zIndex }}
    >
      <div
        className={`${styles.treeInner} ${animate ? '' : styles.instant}`}
        style={{ filter: `drop-shadow(0 ${Math.round(4 * scale)}px ${Math.round(12 * scale)}px rgba(0,0,0,.4))` }}
      >
        <div className={styles.tree}>
          {shape.layers.map((layer, i) => (
            <div
              key={i}
              className={styles.layer}
              style={{
                borderLeftWidth: layer.widthPx / 2,
                borderRightWidth: layer.widthPx / 2,
                borderBottomWidth: layer.heightPx,
                borderBottomColor: layer.color,
                filter: `drop-shadow(${layer.shadowPx}px ${layer.shadowPx * 2}px ${layer.shadowPx * 4}px rgba(0,0,0,.45))`,
                marginBottom: layer.marginBottomPx,
              }}
            />
          ))}
          <div
            className={styles.trunk}
            style={{ width: shape.trunkWidthPx, height: shape.trunkHeightPx }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(Tree);
