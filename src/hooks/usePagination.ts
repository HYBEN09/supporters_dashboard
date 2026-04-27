import { useMemo, useState } from "react";

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, pageSize, safePage]);

  function goToPage(nextPage: number) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(safePage);
  }

  return {
    page: safePage,
    pageSize,
    totalPages,
    paginatedItems,
    goToPage,
  };
}
