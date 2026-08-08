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
    <div className={styles.paginationBar}>
      <button
        className={styles.pageBtn}
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        title="Previous Page"
      >
        ◀ Prev
      </button>

      <div className={styles.pageInfo}>
        <span className={styles.pageTitle}>
          Page {currentPage + 1} of {totalPages}
        </span>
        <span className={styles.treeCapacity}>
          ({treesOnCurrentPage.toLocaleString()} / {maxTreesPerPage.toLocaleString()} trees)
        </span>
      </div>

      <button
        className={styles.pageBtn}
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        title="Next Page"
      >
        Next ▶
      </button>
    </div>
  );
}
