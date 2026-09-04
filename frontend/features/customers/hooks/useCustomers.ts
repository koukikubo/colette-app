"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";

import { fetchCustomers } from "../api/customer-api";
import type { Customer, CustomerListParams } from "../types";

type UseCustomersOptions = CustomerListParams & {
  reloadKey?: number;
};

// 指定された検索条件とページ情報を使って顧客一覧を取得する。
export function useCustomers({
  visibility = "visible",
  customer_kind,
  query,
  page = 1,
  per_page = 20,
  reloadKey = 0,
}: UseCustomersOptions) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadCustomers() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchCustomers({
          visibility,
          customer_kind,
          query,
          page,
          per_page,
        });

        if (isCancelled) return;

        setCustomers(response.data.customers);
        setPagination(response.data.pagination);
      } catch (error) {
        if (isCancelled) return;

        if (error instanceof ApiClientError) {
          const details =
            error.errorMessages.length > 0
              ? ` ${error.errorMessages.join(" / ")}`
              : "";

          setErrorMessage(
            `顧客一覧を取得できませんでした。` +
              `（HTTP ${error.status}）` +
              `${error.message}${details}`,
          );

          return;
        }

        setErrorMessage("顧客一覧の取得中に予期しないエラーが発生しました。");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCustomers();

    return () => {
      isCancelled = true;
    };
  }, [visibility, customer_kind, query, page, per_page, reloadKey]);

  return {
    customers,
    pagination,
    isLoading,
    errorMessage,
  };
}
