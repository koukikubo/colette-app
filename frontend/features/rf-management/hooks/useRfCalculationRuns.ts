"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";

import { fetchRfCalculationRuns } from "../api/rf-management-api";
import type { RfCalculationRunSummary } from "../types";

type UseRfCalculationRunsOptions = {
  page?: number;
  perPage?: number;
  reloadKey?: number;
};

export function useRfCalculationRuns({
  page = 1,
  perPage = 10,
  reloadKey,
}: UseRfCalculationRunsOptions = {}) {
  const [calculationRuns, setCalculationRuns] = useState<
    RfCalculationRunSummary[]
  >([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pollingKey, setPollingKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let pollingTimer: ReturnType<typeof setTimeout> | undefined;

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

        const hasRunningCalculation = response.data.calculation_runs.some(
          (calculationRun) =>
            calculationRun.status === "pending" ||
            calculationRun.status === "processing",
        );

        if (hasRunningCalculation && !controller.signal.aborted) {
          pollingTimer = setTimeout(() => {
            setPollingKey((current) => current + 1);
          }, 2_000);
        }
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

      if (pollingTimer) {
        clearTimeout(pollingTimer);
      }
    };
  }, [page, perPage, reloadKey, pollingKey]);

  return {
    calculationRuns,
    pagination,
    isLoading,
    errorMessage,
  };
}
