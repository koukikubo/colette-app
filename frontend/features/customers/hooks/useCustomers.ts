"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClientError } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";
import { fetchCustomers } from "../api/customer-api";
import type { Customer, CustomerListParams } from "../types";
type UseCustomersOptions = CustomerListParams & { reloadKey?: number };

// 通常の読取は画面のエラーへ、保存後の再取得は呼出元にも失敗を返す。
export function useCustomers({
  visibility = "visible",
  customer_kind,
  customer_rank_id,
  query,
  page = 1,
  per_page = 20,
  reloadKey = 0,
}: UseCustomersOptions) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const request = useRef(0);
  const invalidateRequest = useCallback(() => {
    request.current++;
  }, []);
  const refresh = useCallback(async () => {
    const version = ++request.current;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchCustomers({
        visibility,
        customer_kind,
        ...(customer_rank_id !== undefined ? { customer_rank_id } : {}),
        query,
        page,
        per_page,
      });
      if (version !== request.current) return;
      setCustomers(response.data.customers);
      setPagination(response.data.pagination);
    } catch (error) {
      if (version !== request.current) return;
      setErrorMessage(
        error instanceof ApiClientError
          ? `顧客一覧を取得できませんでした。（HTTP ${error.status}）${error.message}${error.errorMessages.length ? ` ${error.errorMessages.join(" / ")}` : ""}`
          : "顧客一覧の取得中に予期しないエラーが発生しました。",
      );
      throw error;
    } finally {
      if (version === request.current) setIsLoading(false);
    }
  }, [visibility, customer_kind, customer_rank_id, query, page, per_page]);
  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => (active ? refresh() : undefined))
      .catch(() => undefined);
    return () => {
      active = false;
      invalidateRequest();
    };
  }, [refresh, reloadKey, invalidateRequest]);
  return { customers, pagination, isLoading, errorMessage, refresh };
}
