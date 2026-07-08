import styles from "./Pagination.module.css";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

const MAX_VISIBLE_PAGES = 10;

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const pageGroupStart =
    Math.floor((page - 1) / MAX_VISIBLE_PAGES) * MAX_VISIBLE_PAGES + 1;
  const pageGroupEnd = Math.min(
    pageGroupStart + MAX_VISIBLE_PAGES - 1,
    totalPages,
  );
  const pages = Array.from(
    { length: pageGroupEnd - pageGroupStart + 1 },
    (_, index) => pageGroupStart + index,
  );

  return (
    <nav className={styles.pagination} aria-label="페이지네이션">
      <button
        aria-label="이전 페이지"
        className={`${styles.pageButton} ${styles.arrowButton}`}
        disabled={page === 1}
        type="button"
        onClick={() => onChange(page - 1)}
      >
        <span aria-hidden="true">‹</span>
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
        className={`${styles.pageButton} ${styles.arrowButton}`}
        disabled={page === totalPages}
        type="button"
        onClick={() => onChange(page + 1)}
      >
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
