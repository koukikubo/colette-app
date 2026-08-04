"use client";

import { useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";

import { fetchCustomers } from "../api/customer-api";
import type { Customer, CustomerListParams } from "../types";

export function useCustomerSearch() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function searchCustomers(params: CustomerListParams) {
    setIsSearching(true);
    setErrorMessage(null);

    try {
      const response = await fetchCustomers(params);

      setCustomers(response.data.customers);
    } catch (error) {
      setCustomers([]);

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
    setErrorMessage(null);
  }

  return {
    customers,
    isSearching,
    errorMessage,
    searchCustomers,
    clearCustomers,
  };
}
