"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClientError } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";
import { fetchCustomers } from "../api/customer-api";
import type {
  CustomerListItem,
  CustomerListParams,
  CustomerRfReference,
} from "../types";
type UseCustomersOptions = CustomerListParams & {
  reloadKey?: number;
  enabled?: boolean;
};

// 通常の読取は画面のエラーへ、保存後の再取得は呼出元にも失敗を返す。
export function useCustomers({
  enabled = true,
  last_visit_from,
  last_visit_to,
  min_visits,
  max_visits,
  visibility = "visible",
  customer_kind,
  customer_rank_id,
  rf_rank_id,
  rf_rank_state,
  query,
  page = 1,
  per_page = 20,
  reloadKey = 0,
}: UseCustomersOptions) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rfReference, setRfReference] = useState<CustomerRfReference | null>(
    null,
  );
  const request = useRef(0);
  const invalidateRequest = useCallback(() => {
    request.current++;
  }, []);
  const refresh = useCallback(async () => {
    const version = ++request.current;
    if (!enabled) {
      setCustomers([]);
      setRfReference(null);
      setPagination(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchCustomers({
        last_visit_from,
        last_visit_to,
        min_visits,
        max_visits,
        visibility,
        customer_kind,
        ...(customer_rank_id !== undefined ? { customer_rank_id } : {}),
        rf_rank_id,
        rf_rank_state,
        query,
        page,
        per_page,
      });
      if (version !== request.current) return;
      setCustomers(response.data.customers);
      setPagination(response.data.pagination);
      setRfReference(response.data.rf_reference ?? null);
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
  }, [
    enabled,
    last_visit_from,
    last_visit_to,
    min_visits,
    max_visits,
    visibility,
    customer_kind,
    customer_rank_id,
    rf_rank_id,
    rf_rank_state,
    query,
    page,
    per_page,
  ]);
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
  return {
    customers,
    pagination,
    rfReference,
    isLoading,
    errorMessage,
    refresh,
  };
}
