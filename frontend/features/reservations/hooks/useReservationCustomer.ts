"use client";
// EditReservationFormContainerとNewReservationFormContainerで共通利用する予約フォームの入力値と登録処理を管理する。
import { useState, type Dispatch, type SetStateAction } from "react";

import type { Customer } from "@/features/customers/types";
import { useCustomerSearch } from "@/features/customers/hooks/useCustomerSearch";

import type { ReservationFormValues } from "../types";

type UseReservationCustomerParams = {
  setValues: Dispatch<SetStateAction<ReservationFormValues>>;
  clearFieldError: (fieldName: string) => void;
  initialCustomerHasNoPhone?: boolean;
};

// 予約フォームにおける顧客検索・選択・解除処理を管理する。
export function useReservationCustomer({
  setValues,
  clearFieldError,
  initialCustomerHasNoPhone = false,
}: UseReservationCustomerParams) {
  const [customerQuery, setCustomerQuery] = useState("");
  const [hasSearchedCustomers, setHasSearchedCustomers] = useState(false);
  const [selectedCustomerHasNoPhone, setSelectedCustomerHasNoPhone] = useState(
    initialCustomerHasNoPhone,
  );

  const {
    customers,
    isSearching: isCustomerSearching,
    errorMessage: customerSearchError,
    searchCustomers,
    clearCustomers,
  } = useCustomerSearch();

  async function handleCustomerSearch() {
    const query = customerQuery.trim();

    // 空の検索リクエストは送信しない。
    if (!query) {
      clearCustomers();
      setHasSearchedCustomers(false);
      return;
    }

    setHasSearchedCustomers(true);

    await searchCustomers({
      visibility: "visible",
      query,
    });
  }

  function handleCustomerSelect(customer: Customer) {
    // 別の顧客を選択した時点で、以前の名前・電話番号エラーを消す。
    clearFieldError("reservation_name");
    clearFieldError("reservation_phone_number");

    setSelectedCustomerHasNoPhone(!customer.phone_number);

    setValues((currentValues) => ({
      ...currentValues,
      customer_id: customer.id,
      reservation_name: customer.name,
      reservation_phone_number: customer.phone_number ?? "",
    }));

    setCustomerQuery("");
    clearCustomers();
    setHasSearchedCustomers(false);
  }

  function handleCustomerClear() {
    setSelectedCustomerHasNoPhone(false);

    // 入力中の名前・電話番号は残し、顧客との関連だけを解除する。
    setValues((currentValues) => ({
      ...currentValues,
      customer_id: null,
    }));
  }

  return {
    customerQuery,
    customers,
    isCustomerSearching,
    customerSearchError,
    hasSearchedCustomers,
    selectedCustomerHasNoPhone,
    setCustomerQuery,
    handleCustomerSearch,
    handleCustomerSelect,
    handleCustomerClear,
  };
}
