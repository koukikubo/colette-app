"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateReservation } from "../../api/reservation_api";
import { ApiClientError } from "@/lib/api/api-client";

import { useReservation } from "../../hooks/useReservation";
import type { Reservation, ReservationFormValues } from "../../types";
import {
  buildEditReservationFormValues,
  buildUpdateReservationRequest,
} from "../../utils/reservation-form";
import { useReservationFormOptions } from "../../hooks/useReservationFormOptions";

import { useReservationCustomer } from "../../hooks/useReservationCustomer";
import { useFieldErrors } from "@/hooks/useFieldErrors";

import { ReservationForm } from "./ReservationForm";
import { ReservationUpdateConfirmDialog } from "../dialogs/ReservationUpdateConfirmDialog";
import { ConfirmDiscardChangesDialog } from "@/components/common/ConfirmDiscardChangesDialog";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

type EditReservationFormContentProps = {
  reservation: Reservation;
};

// 取得済みの予約から編集フォームの入力状態を作成する。
function EditReservationFormContent({
  reservation,
}: EditReservationFormContentProps) {
  const router = useRouter();
  const [values, setValues] = useState<ReservationFormValues>(() =>
    buildEditReservationFormValues(reservation),
  );

  const [lockVersion] = useState(reservation.lock_version);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { fieldErrors, clearFieldError, setFieldErrors, clearAllFieldErrors } =
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

  const initialValues = buildEditReservationFormValues(reservation);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const {
    discardDialogOpen,
    requestNavigation,
    confirmDiscard,
    handleDiscardDialogOpenChange,
  } = useUnsavedChangesGuard(isDirty);

  // 編集した予約内容をRailsの更新APIへ送信する。
  async function handleSubmit() {
    // 二重クリックによる重複送信を防ぐ。
    if (isSubmitting) return;

    setSubmitErrorMessage(null);
    clearAllFieldErrors();
    setIsSubmitting(true);

    try {
      const request = buildUpdateReservationRequest(values, lockVersion);

      await updateReservation(reservation.id, request);

      // 更新した予約の詳細ページへ戻る。
      router.push(`/reservations/${reservation.id}`);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmitErrorMessage(error.message);

        if (error.status === 422 && !Array.isArray(error.errors)) {
          setFieldErrors(error.errors);
        }

        return;
      }

      setSubmitErrorMessage("予約の更新中に予期しないエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  }
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
    <>
      <ReservationForm
        values={values}
        onChange={setValues}
        requestedRestaurantMasterTypes={requestedRestaurantMasterTypes}
        reservationRoutes={reservationRoutes}
        menuTypes={menuTypes}
        reservationOccasion={reservationOccasions}
        reservationStatuses={reservationStatuses}
        onSubmit={() => setConfirmOpen(true)}
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
        cancelLabel="閉じる"
        onCancel={() => {
          requestNavigation(() => {
            router.push(`/reservations/${reservation.id}`);
          });
        }}
      />

      <ReservationUpdateConfirmDialog
        open={confirmOpen}
        reservation={reservation}
        values={values}
        requestedRestaurantMasterTypes={requestedRestaurantMasterTypes}
        reservationRoutes={reservationRoutes}
        menuTypes={menuTypes}
        reservationOccasions={reservationOccasions}
        reservationStatuses={reservationStatuses}
        isSubmitting={isSubmitting}
        onOpenChange={setConfirmOpen}
        onConfirm={handleSubmit}
      />

      <ConfirmDiscardChangesDialog
        open={discardDialogOpen}
        onOpenChange={handleDiscardDialogOpenChange}
        onConfirm={confirmDiscard}
      />
    </>
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
