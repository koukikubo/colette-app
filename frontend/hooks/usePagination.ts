"use client";

import { useState } from "react";

type UsePaginationOptions = {
  initialPage?: number;
  initialPerPage?: number;
};

export function usePagination({
  initialPage = 1,
  initialPerPage = 20,
}: UsePaginationOptions = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);

  function resetPage() {
    setCurrentPage(1);
  }

  return {
    currentPage,
    perPage,
    setCurrentPage,
    setPerPage,
    resetPage,
  };
}
