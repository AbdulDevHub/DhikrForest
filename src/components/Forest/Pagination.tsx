import styles from './Forest.module.css';

interface PaginationProps {
  currentPage: number; // 0-indexed
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  treesOnCurrentPage: number;
  maxTreesPerPage: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  treesOnCurrentPage,
  maxTreesPerPage,
}: PaginationProps) {
  return (
    <nav className={styles.pager} aria-label="Gardens">
      <button
        type="button"
        className={styles.pageBtn}
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous garden"
      >
        ‹
      </button>

      <div className={styles.pageInfo}>
        <span className={styles.pageTitle}>
          Garden {currentPage + 1} <span className={styles.pageOf}>of {totalPages}</span>
        </span>
        <span className={styles.treeCapacity}>
          {treesOnCurrentPage.toLocaleString()} / {maxTreesPerPage.toLocaleString()} trees
        </span>
      </div>

      <button
        type="button"
        className={styles.pageBtn}
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next garden"
      >
        ›
      </button>
    </nav>
  );
}
