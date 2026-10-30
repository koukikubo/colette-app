"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";

import { fetchRfCustomerTransitionTable } from "../api/customer-transition-api";
import type { RfCustomerTransitionTable } from "../types/customer-transition";

export function useRfCustomerTransitionTable(reloadKey = 0) {
  const [table, setTable] = useState<RfCustomerTransitionTable | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTable() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchRfCustomerTransitionTable(
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        setTable(response.data.table);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setTable(null);
        setErrorMessage(
          error instanceof ApiClientError
            ? error.message
            : "RFランク客層変動表を取得できませんでした。",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadTable();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  return {
    table,
    isLoading,
    errorMessage,
  };
}
