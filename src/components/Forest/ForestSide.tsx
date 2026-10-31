import type { EffectiveTimeOfDay, TreeType } from '../../types';
import { TREES_PER_PAGE } from '../../utils/constants';
import ForestCanvas from './ForestCanvas';
import Pagination from './Pagination';
import Flash from './Flash';
import styles from './Forest.module.css';

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
  const isEmpty = totalPages === 1 && activePageItems.length === 0;

  return (
    <main aria-label="Your garden in Jannah" className={styles.forestSide}>
      <ForestCanvas
        items={activePageItems}
        startIndex={currentPage * TREES_PER_PAGE}
        page={currentPage}
        mode={effectiveTimeMode}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        treesOnCurrentPage={activePageItems.length}
        maxTreesPerPage={TREES_PER_PAGE}
      />

      {isEmpty && (
        <p className={styles.emptyHint}>
          Your garden is waiting 🌱
          <span>Each dhikr plants a tree beside the river, in shāʾ Allāh.</span>
        </p>
      )}

      <Flash flashKey={flashKey} />
    </main>
  );
}
