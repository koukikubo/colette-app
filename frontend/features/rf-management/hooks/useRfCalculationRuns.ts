"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";

import { fetchRfCalculationRuns } from "../api/rf-management-api";
import type { RfCalculationRunSummary } from "../types";

type UseRfCalculationRunsOptions = {
  page?: number;
  perPage?: number;
};

export function useRfCalculationRuns({
  page = 1,
  perPage = 10,
}: UseRfCalculationRunsOptions = {}) {
  const [calculationRuns, setCalculationRuns] = useState<
    RfCalculationRunSummary[]
  >([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCalculationRuns() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchRfCalculationRuns(
          {
            page,
            per_page: perPage,
          },
          controller.signal,
        );

        setCalculationRuns(response.data.calculation_runs);
        setPagination(response.data.pagination);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setCalculationRuns([]);
        setPagination(null);
        setErrorMessage(
          error instanceof ApiClientError
            ? error.message
            : "RF計算履歴を取得できませんでした。",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadCalculationRuns();

    return () => {
      controller.abort();
    };
  }, [page, perPage]);

  return {
    calculationRuns,
    pagination,
    isLoading,
    errorMessage,
  };
}
