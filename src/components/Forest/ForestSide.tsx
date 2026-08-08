import type { TreeItem } from '../../types';
import { TREES_PER_PAGE } from '../../utils/constants';
import ForestCanvas from './ForestCanvas';
import Pagination from './Pagination';
import Flash from './Flash';
import styles from './Forest.module.css';

interface ForestSideProps {
  activePageItems: TreeItem[];
  currentPage: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  flashKey: number;
}

export default function ForestSide({
  activePageItems,
  currentPage,
  totalPages,
  onPageChange,
  flashKey,
}: ForestSideProps) {
  return (
    <div className={styles.forestSide}>
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
    </div>
  );
}
