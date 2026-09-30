"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";

import { fetchRfCalculationResults } from "../api/rf-management-api";
import type { RfCustomerRankResult } from "../types";

type UseRfCalculationResultsOptions = {
  calculationRunId: number | null;
  page?: number;
  perPage?: number;
};

type CalculationResultsLoadResult = {
  calculationRunId: number;
  page: number;
  perPage: number;
  results: RfCustomerRankResult[];
  pagination: Pagination | null;
  errorMessage: string | null;
};

export function useRfCalculationResults({
  calculationRunId,
  page = 1,
  perPage = 20,
}: UseRfCalculationResultsOptions) {
  const [loadResult, setLoadResult] =
    useState<CalculationResultsLoadResult | null>(null);

  useEffect(() => {
    if (calculationRunId === null) {
      return;
    }

    const selectedCalculationRunId = calculationRunId;
    const selectedPage = page;
    const selectedPerPage = perPage;
    const controller = new AbortController();

    async function loadCalculationResults() {
      try {
        const response = await fetchRfCalculationResults(
          selectedCalculationRunId,
          {
            page: selectedPage,
            per_page: selectedPerPage,
          },
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        setLoadResult({
          calculationRunId: selectedCalculationRunId,
          page: selectedPage,
          perPage: selectedPerPage,
          results: response.data.results,
          pagination: response.data.pagination,
          errorMessage: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setLoadResult({
          calculationRunId: selectedCalculationRunId,
          page: selectedPage,
          perPage: selectedPerPage,
          results: [],
          pagination: null,
          errorMessage:
            error instanceof ApiClientError
              ? error.message
              : "顧客別RF計算結果を取得できませんでした。",
        });
      }
    }

    void loadCalculationResults();

    return () => {
      controller.abort();
    };
  }, [calculationRunId, page, perPage]);

  const currentResult =
    calculationRunId !== null &&
    loadResult?.calculationRunId === calculationRunId &&
    loadResult.page === page &&
    loadResult.perPage === perPage
      ? loadResult
      : null;

  return {
    results: currentResult?.results ?? [],
    pagination: currentResult?.pagination ?? null,
    isLoading: calculationRunId !== null && currentResult === null,
    errorMessage: currentResult?.errorMessage ?? null,
  };
}
