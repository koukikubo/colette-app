"use client";
import { useState } from "react";
import { useReservationFormOptions } from "../../hooks/useReservationFormOptions";

import type { ReservationFormValues } from "../../types";
import {
  buildNewReservationFormValues,
  buildCreateReservationRequest,
} from "../../utils/reservation-form";
import { ReservationForm } from "./ReservationForm";
import { createReservation } from "../../api/reservation_api";
import { ApiClientError } from "@/lib/api/api-client";
import { useRouter } from "next/navigation";

import { useCustomerSearch } from "@/features/customers/hooks/useCustomerSearch";
import type { Customer } from "@/features/customers/types";
import { useFieldErrors } from "@/hooks/useFieldErrors";

// 新規登録Containerが親から受け取るデータ
type NewReservationFormContainerProps = {
  // 初期日時を作るための対象日
  targetDate: string;
};

// 新規予約フォームの入力値と登録処理を管理する
export function NewReservationFormContainer(
  props: NewReservationFormContainerProps,
) {
  const router = useRouter();
  const targetDate = props.targetDate;
  // 対象日から初期値を作り、入力中の値として管理する
  const [values, setValues] = useState<ReservationFormValues>(() => {
    return buildNewReservationFormValues({ targetDate });
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [hasSearchedCustomers, setHasSearchedCustomers] = useState(false);
  const { fieldErrors, setFieldErrors, clearFieldError, clearAllFieldErrors } =
    useFieldErrors();

  // 新規・編集フォームで共通利用するマスタ選択肢を取得する。
  const {
    requestedRestaurantMasterTypes,
    reservationRoutes,
    menuTypes,
    reservationOccasions,
    reservationStatuses,
    // restaurantMasters,
  } = useReservationFormOptions();

  const [selectedCustomerHasNoPhone, setSelectedCustomerHasNoPhone] =
    useState(false);
  // 顧客検索用
  const {
    customers,
    isSearching: isCustomerSearching,
    errorMessage: customerSearchError,
    searchCustomers,
    clearCustomers,
  } = useCustomerSearch();

  // const activeRestaurantMasters = restaurantMasters.filter(
  //   (restaurantMaster) => restaurantMaster.active,
  // );

  async function handleCustomerSearch() {
    const query = customerQuery.trim();

    // これは入力値の妥当性チェックではなく、空の検索通信を防ぐための制御です。
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
    // 顧客選択時に「残っていたエラー表示」をクリアする
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

  // 予約登録APIを呼び出す
  async function handleSubmit() {
    if (isSubmitting) return;

    setErrorMessage(null);
    clearAllFieldErrors();
    setIsSubmitting(true);

    try {
      const request = buildCreateReservationRequest(values);

      await createReservation(request);
      // 成功したら対象日の予約一覧へ戻る
      router.push(`/reservations?date=${targetDate}`);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);

        if (error.status === 422 && !Array.isArray(error.errors)) {
          setFieldErrors(error.errors);
        }
        return;
      }
      // 失敗したらエラーメッセージを表示する
      setErrorMessage("予約の登録中に予期しないエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  }
  // 顧客選択を解除する関数
  function handleCustomerClear() {
    setSelectedCustomerHasNoPhone(false);

    setValues((currentValues) => ({
      ...currentValues,
      customer_id: null,
    }));
  }

  // 入力値と変更用の関数をReservationFormへ渡す
  return (
    <ReservationForm
      values={values}
      onChange={setValues}
      requestedRestaurantMasterTypes={requestedRestaurantMasterTypes}
      reservationRoutes={reservationRoutes}
      menuTypes={menuTypes}
      reservationOccasion={reservationOccasions}
      reservationStatuses={reservationStatuses}
      onSubmit={handleSubmit}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      customerQuery={customerQuery}
      customers={customers}
      isCustomerSearching={isCustomerSearching}
      customerSearchError={customerSearchError}
      onCustomerQueryChange={setCustomerQuery}
      onCustomerSearch={handleCustomerSearch}
      onCustomerSelect={handleCustomerSelect}
      hasSearchedCustomers={hasSearchedCustomers}
      fieldErrors={fieldErrors}
      onClearFieldError={clearFieldError}
      onCustomerClear={handleCustomerClear}
      selectedCustomerHasNoPhone={selectedCustomerHasNoPhone}
      // restaurantMasters={activeRestaurantMasters}
    />
  );
}
