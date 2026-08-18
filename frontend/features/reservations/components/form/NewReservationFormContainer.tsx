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

import { useFieldErrors } from "@/hooks/useFieldErrors";
import { useReservationCustomer } from "../../hooks/useReservationCustomer";

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
  const { fieldErrors, setFieldErrors, clearFieldError, clearAllFieldErrors } =
    useFieldErrors();
  const {
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
  } = useReservationCustomer({
    setValues,
    clearFieldError,
  });

  // 新規・編集フォームで共通利用するマスタ選択肢を取得する。
  const {
    requestedRestaurantMasterTypes,
    reservationRoutes,
    menuTypes,
    reservationOccasions,
    reservationStatuses,
    restaurantMasters,
  } = useReservationFormOptions();

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
      restaurantMasters={restaurantMasters}
    />
  );
}
