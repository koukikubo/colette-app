"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";

import { fetchRfRuleSets } from "../api/rf-management-api";
import type { RfRuleSetStatus, RfRuleSetSummary } from "../types";

type UseRfRuleSetsOptions = {
  page?: number;
  perPage?: number;
  reloadKey?: number;
  status?: RfRuleSetStatus;
};

export function useRfRuleSets({
  page = 1,
  perPage = 10,
  reloadKey = 0,
  status,
}: UseRfRuleSetsOptions = {}) {
  const [ruleSets, setRuleSets] = useState<RfRuleSetSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRuleSets() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchRfRuleSets(
          {
            page,
            per_page: perPage,
            ...(status ? { status } : {}),
          },
          controller.signal,
        );

        setRuleSets(response.data.rule_sets);
        setPagination(response.data.pagination);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setRuleSets([]);
        setPagination(null);
        setErrorMessage(
          error instanceof ApiClientError
            ? error.message
            : "RFルールを取得できませんでした。",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadRuleSets();

    return () => controller.abort();
  }, [page, perPage, reloadKey, status]);

  return {
    ruleSets,
    pagination,
    isLoading,
    errorMessage,
  };
}
