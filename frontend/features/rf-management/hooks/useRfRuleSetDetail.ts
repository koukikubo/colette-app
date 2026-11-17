"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";

import { fetchRfRuleSet } from "../api/rf-management-api";
import type { RfRuleSet } from "../types";

type RuleSetLoadResult = {
  ruleSetId: number;
  reloadKey: number;
  ruleSet: RfRuleSet | null;
  errorMessage: string | null;
};

type UseRfRuleSetDetailOptions = {
  ruleSetId: number | null;
  reloadKey?: number;
};

export function useRfRuleSetDetail({
  ruleSetId,
  reloadKey = 0,
}: UseRfRuleSetDetailOptions) {
  const [loadResult, setLoadResult] = useState<RuleSetLoadResult | null>(null);

  useEffect(() => {
    if (ruleSetId === null) return;

    const selectedRuleSetId = ruleSetId;
    const controller = new AbortController();

    async function loadRuleSet() {
      try {
        const response = await fetchRfRuleSet(
          selectedRuleSetId,
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setLoadResult({
          ruleSetId: selectedRuleSetId,
          reloadKey,
          ruleSet: response.data.rule_set,
          errorMessage: null,
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadResult({
          ruleSetId: selectedRuleSetId,
          reloadKey,
          ruleSet: null,
          errorMessage:
            error instanceof ApiClientError
              ? error.message
              : "RFルールの詳細を取得できませんでした。",
        });
      }
    }

    void loadRuleSet();

    return () => controller.abort();
  }, [ruleSetId, reloadKey]);

  const currentResult =
    loadResult?.ruleSetId === ruleSetId && loadResult.reloadKey === reloadKey
      ? loadResult
      : null;

  return {
    ruleSet: currentResult?.ruleSet ?? null,
    errorMessage: currentResult?.errorMessage ?? null,
    isLoading: ruleSetId !== null && currentResult === null,
  };
}
