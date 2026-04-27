import styles from "./Pagination.module.css";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className={styles.pagination} aria-label="페이지네이션">
      <button
        aria-label="이전 페이지"
        className={styles.pageButton}
        disabled={page === 1}
        type="button"
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>
      {pages.map((pageNumber) => (
        <button
          aria-current={pageNumber === page ? "page" : undefined}
          className={
            pageNumber === page
              ? `${styles.pageButton} ${styles.active}`
              : styles.pageButton
          }
          key={pageNumber}
          type="button"
          onClick={() => onChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}
      <button
        aria-label="다음 페이지"
        className={styles.pageButton}
        disabled={page === totalPages}
        type="button"
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </nav>
  );
}
