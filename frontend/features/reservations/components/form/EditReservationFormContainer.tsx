"use client";

import { useState } from "react";

import { useReservation } from "../../hooks/useReservation";
import type { Reservation, ReservationFormValues } from "../../types";
import { buildEditReservationFormValues } from "../../utils/reservation-form";
import { useReservationFormOptions } from "../../hooks/useReservationFormOptions";

import { useReservationCustomer } from "../../hooks/useReservationCustomer";
import { useFieldErrors } from "@/hooks/useFieldErrors";

import { ReservationForm } from "./ReservationForm";

type EditReservationFormContentProps = {
  reservation: Reservation;
};

// 取得済みの予約から編集フォームの入力状態を作成する。
function EditReservationFormContent({
  reservation,
}: EditReservationFormContentProps) {
  const [values, setValues] = useState<ReservationFormValues>(() =>
    buildEditReservationFormValues(reservation),
  );

  const [lockVersion] = useState(reservation.lock_version);
  const [submitErrorMessage] = useState<string | null>(null);
  const [isSubmitting] = useState(false);

  const { fieldErrors, clearFieldError } = useFieldErrors();
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
    initialCustomerHasNoPhone:
      reservation.customer_id !== null && !reservation.reservation_phone_number,
  });

  const {
    requestedRestaurantMasterTypes,
    reservationRoutes,
    menuTypes,
    reservationOccasions,
    reservationStatuses,
    isLoading: isOptionsLoading,
    errorMessage: optionsErrorMessage,
  } = useReservationFormOptions();
  if (isOptionsLoading) {
    return <p className="p-6">フォームの選択肢を読み込んでいます。</p>;
  }

  if (optionsErrorMessage) {
    return (
      <p className="p-6 text-destructive" role="alert">
        {optionsErrorMessage}
      </p>
    );
  }

  return (
    <ReservationForm
      values={values}
      onChange={setValues}
      requestedRestaurantMasterTypes={requestedRestaurantMasterTypes}
      reservationRoutes={reservationRoutes}
      menuTypes={menuTypes}
      reservationOccasion={reservationOccasions}
      reservationStatuses={reservationStatuses}
      onSubmit={() => {}}
      errorMessage={submitErrorMessage}
      isSubmitting={isSubmitting}
      submitLabel="予約を更新"
      submittingLabel="更新中…"
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
    />
  );
}

type EditReservationFormContainerProps = {
  reservationId: number;
};

// URLから受け取った予約IDを使い、編集対象の予約を取得する。
export function EditReservationFormContainer({
  reservationId,
}: EditReservationFormContainerProps) {
  const { reservation, isLoading, errorMessage } =
    useReservation(reservationId);

  if (isLoading) {
    return <p className="p-6">予約情報を読み込んでいます。</p>;
  }

  if (errorMessage) {
    return (
      <p className="p-6 text-destructive" role="alert">
        {errorMessage}
      </p>
    );
  }

  if (!reservation) {
    return (
      <p className="p-6 text-destructive" role="alert">
        予約情報を表示できませんでした。
      </p>
    );
  }

  return (
    <EditReservationFormContent
      key={reservation.id}
      reservation={reservation}
    />
  );
}
