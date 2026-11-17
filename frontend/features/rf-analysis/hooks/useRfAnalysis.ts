"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";

import { RfAnalysis } from "../types/analysis";
import { fetchRfAnalysis } from "../api/rf-analysis-api";

export function useRfAnalysis(reloadKey = 0) {
  const [analysis, setAnalysis] = useState<RfAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalysis() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchRfAnalysis(controller.signal);

        setAnalysis(response.data.analysis);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setAnalysis(null);
        setErrorMessage(
          error instanceof ApiClientError
            ? error.message
            : "RF分析結果を取得できませんでした。",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadAnalysis();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  return {
    analysis,
    isLoading,
    errorMessage,
  };
}
