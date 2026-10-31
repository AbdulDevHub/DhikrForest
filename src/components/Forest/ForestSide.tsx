import type { EffectiveTimeOfDay, TreeType } from '../../types';
import { TREES_PER_PAGE } from '../../utils/constants';
import ForestCanvas from './ForestCanvas';
import Pagination from './Pagination';
import Flash from './Flash';
import styles from './Forest.module.css';

const GROUND_CLASS: Record<EffectiveTimeOfDay, string> = {
  morning:   'groundMorning',
  afternoon: 'groundAfternoon',
  night:     'groundNight',
  qadr:      'groundQadr',
};

interface ForestSideProps {
  activePageItems: TreeType[];
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
  const groundCls = styles[GROUND_CLASS[effectiveTimeMode] as keyof typeof styles] ?? '';
  const isEmpty = totalPages === 1 && activePageItems.length === 0;

  return (
    <main aria-label="Your forest in Jannah" className={`${styles.forestSide} ${groundCls}`}>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        treesOnCurrentPage={activePageItems.length}
        maxTreesPerPage={TREES_PER_PAGE}
      />

      <div className={styles.canvasContainer}>
        <ForestCanvas items={activePageItems} startIndex={currentPage * TREES_PER_PAGE} />
        {isEmpty && (
          <p className={styles.emptyHint}>
            Your forest is waiting 🌱
            <span>Each dhikr plants a tree here, in shāʾ Allāh.</span>
          </p>
        )}
      </div>

      <div className={styles.skyTint} aria-hidden="true" />
      <Flash flashKey={flashKey} />
    </main>
  );
}
