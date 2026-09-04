"use client";

import { useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";

import { fetchCustomers } from "../api/customer-api";
import type { Customer, CustomerListParams } from "../types";
import { Pagination } from "@/lib/api/pagination";

export function useCustomerSearch() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  async function searchCustomers(params: CustomerListParams) {
    setIsSearching(true);
    setErrorMessage(null);

    try {
      const response = await fetchCustomers(params);

      setCustomers(response.data.customers);

      setCustomers(response.data.customers);
      setPagination(response.data.pagination);
    } catch (error) {
      setCustomers([]);
      setPagination(null);

      if (error instanceof ApiClientError) {
        setErrorMessage(
          `顧客を取得できませんでした。（HTTP ${error.status}）${error.message}`,
        );
        return;
      }

      setErrorMessage("顧客の検索中に予期しないエラーが発生しました。");
    } finally {
      setIsSearching(false);
    }
  }

  function clearCustomers() {
    setCustomers([]);
    setPagination(null);
    setErrorMessage(null);
  }

  return {
    customers,
    pagination,
    isSearching,
    errorMessage,
    searchCustomers,
    clearCustomers,
  };
}
