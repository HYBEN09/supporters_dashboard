import { Button } from "./Button";
import styles from "./Pagination.module.css";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  return (
    <div className={styles.pagination} aria-label="페이지네이션">
      <Button disabled={page === 1} onClick={() => onChange(page - 1)}>
        이전
      </Button>
      <span>
        {page} / {totalPages}
      </span>
      <Button disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        다음
      </Button>
    </div>
  );
}
