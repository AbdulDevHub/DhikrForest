import type { EffectiveTimeOfDay, TreeItem } from '../../types';
import { TREES_PER_PAGE } from '../../utils/constants';
import ForestCanvas from './ForestCanvas';
import Pagination from './Pagination';
import Flash from './Flash';
import styles from './Forest.module.css';

const SOIL_CLASS: Record<EffectiveTimeOfDay, string> = {
  morning:   'soilMorning',
  afternoon: 'soilAfternoon',
  night:     'soilNight',
  qadr:      'soilQadr',
};

interface ForestSideProps {
  activePageItems: TreeItem[];
  currentPage: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  flashKey: number;
  effectiveTimeMode: EffectiveTimeOfDay;
}

export default function ForestSide({
  activePageItems,
  currentPage,
  totalPages,
  onPageChange,
  flashKey,
  effectiveTimeMode,
}: ForestSideProps) {
  const soilCls = styles[SOIL_CLASS[effectiveTimeMode] as keyof typeof styles] ?? '';

  return (
    <main
      aria-label="Jannah Forest Canvas"
      className={`${styles.forestSide} ${soilCls}`}
    >
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        treesOnCurrentPage={activePageItems.length}
        maxTreesPerPage={TREES_PER_PAGE}
      />

      <div className={styles.canvasContainer}>
        <ForestCanvas items={activePageItems} />
      </div>

      <Flash flashKey={flashKey} />
    </main>
  );
}
