"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";

import { fetchRfCalculationRun } from "../api/rf-management-api";
import type { RfCalculationRunDetail } from "../types";

type CalculationRunLoadResult = {
  calculationRunId: number;
  calculationRun: RfCalculationRunDetail | null;
  errorMessage: string | null;
};

export function useRfCalculationRunDetail(calculationRunId: number | null) {
  const [loadResult, setLoadResult] = useState<CalculationRunLoadResult | null>(
    null,
  );

  useEffect(() => {
    if (calculationRunId === null) {
      return;
    }

    const selectedCalculationRunId = calculationRunId;
    const controller = new AbortController();

    async function loadCalculationRun() {
      try {
        const response = await fetchRfCalculationRun(
          selectedCalculationRunId,
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        setLoadResult({
          calculationRunId: selectedCalculationRunId,
          calculationRun: response.data.calculation_run,
          errorMessage: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setLoadResult({
          calculationRunId: selectedCalculationRunId,
          calculationRun: null,
          errorMessage:
            error instanceof ApiClientError
              ? error.message
              : "RF計算履歴の詳細を取得できませんでした。",
        });
      }
    }

    void loadCalculationRun();

    return () => {
      controller.abort();
    };
  }, [calculationRunId]);

  const currentResult =
    calculationRunId !== null &&
    loadResult?.calculationRunId === calculationRunId
      ? loadResult
      : null;

  return {
    calculationRun: currentResult?.calculationRun ?? null,
    isLoading: calculationRunId !== null && currentResult === null,
    errorMessage: currentResult?.errorMessage ?? null,
  };
}
