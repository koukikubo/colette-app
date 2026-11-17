"use client";
import { useRef, useState } from "react";
import { useReservationModalDirty } from "../layouts/reservation-modal-dirty-context";
import {
  useReservationFormOptions,
  type UseReservationFormOptionsResult,
} from "../../hooks/useReservationFormOptions";

import type {
  ReservationCreateRequest,
  ReservationFormValues,
} from "../../types";
import {
  buildNewReservationFormValues,
  buildCreateReservationRequest,
} from "../../utils/reservation-form";
import { ReservationForm } from "./ReservationForm";
import {
  createReservation,
  fetchReservationCreationResult,
} from "../../api/reservation_api";
import { ApiClientError } from "@/lib/api/api-client";
import { useRouter } from "next/navigation";

import { useFieldErrors } from "@/hooks/useFieldErrors";
import { useReservationCustomer } from "../../hooks/useReservationCustomer";
import { useRestaurantMasterAvailability } from "../../hooks/useRestaurantMasterAvailability";
import { ReservationOverlapDialog } from "../dialogs/ReservationOverlapDialog";

import { usePendingCreation } from "@/hooks/usePendingCreation";
import { CreationRecoveryNotice } from "@/components/common/CreationRecoveryNotice";

// 新規登録Containerが親から受け取るデータ
type NewReservationFormContainerProps = {
  // 初期日時を作るための対象日
  targetDate: string;
  startTime?: string;
  restaurantMasterId?: number;
  modal?: boolean;
};

// 新規予約フォームの入力値と登録処理を管理する
function NewReservationFormContent(
  props: NewReservationFormContainerProps & {
    options: UseReservationFormOptionsResult;
  },
) {
  const router = useRouter();
  const targetDate = props.targetDate;
  // 対象日から初期値を作り、入力中の値として管理する
  const [values, setValues] = useState<ReservationFormValues>(() => {
    const initial = buildNewReservationFormValues({
      targetDate,
      startTime: props.startTime,
      restaurantMasterId: props.restaurantMasterId,
    });
    const seat = props.options.restaurantMasters.find(
      (seat) => seat.id === props.restaurantMasterId && seat.active,
    );
    if (seat) {
      initial.requested_restaurant_master_type_id =
        seat.restaurant_master_type_id;
      initial.guest_count = Math.min(initial.guest_count, seat.capacity);
    } else initial.restaurant_master_ids = [];
    return initial;
  });
  const [initialValues] = useState(values);
  useReservationModalDirty(
    JSON.stringify(values) !== JSON.stringify(initialValues),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fieldErrors, setFieldErrors, clearFieldError, clearAllFieldErrors } =
    useFieldErrors();

  const recovery = usePendingCreation(
    "reservations",
    fetchReservationCreationResult,
  );
  const [created, setCreated] = useState(false);
  const submitting = useRef(false);

  const [overlapDialogOpen, setOverlapDialogOpen] = useState(false);

  const {
    customerQuery,
    customers,
    isCustomerSearching,
    customerSearchPagination,
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
  } = props.options;

  const {
    unavailableRestaurantMasterIds,
    isAvailabilityLoading,
    availabilityErrorMessage,
  } = useRestaurantMasterAvailability({
    startsAt: values.starts_at,
    endsAt: values.ends_at,
  });

  // 予約登録APIを呼び出す
  async function handleSubmit(retryPrevious = false) {
    if (submitting.current || created) return;
    const input = retryPrevious
      ? recovery.previousPayload<ReservationCreateRequest>()
      : buildCreateReservationRequest(values);
    if (!input) return;
    submitting.current = true;

    setErrorMessage(null);
    clearAllFieldErrors();
    setIsSubmitting(true);

    try {
      const key = recovery.begin(input);
      await createReservation(input, key);
      if (!recovery.isActive()) return;
      recovery.complete();
      setCreated(true);
      // 成功したら対象日の予約一覧へ戻る
      if (props.modal) {
        router.back();
        window.dispatchEvent(new Event("colette:reservations-changed"));
      } else router.push(`/reservations?date=${targetDate}`);
    } catch (error) {
      // 5xx・通信切断は保存済みか判断できないため、別の作成へ切り替えない。
      recovery.failed(error);
      if (error instanceof ApiClientError) {
        // 再試行前のCSRF等の拒否では、最初の保存結果は確定しない。
        // 既に結果不明なら、元のキー・本文を保持して新規作成へ切り替えない。
        setErrorMessage(error.message);

        if (error.status === 422 && !Array.isArray(error.errors)) {
          setFieldErrors(error.errors);
        }

        if (
          error.status === 422 &&
          error.code === "customer_reservation_overlap"
        ) {
          setOverlapDialogOpen(true);
        }

        return;
      }
      // 失敗したらエラーメッセージを表示する
      setErrorMessage("予約の登録中に予期しないエラーが発生しました。");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  // 重複した予約日を指定して予約一覧へ移動する。
  function handleViewReservations() {
    const reservationDate = values.starts_at.slice(0, 10);

    setOverlapDialogOpen(false);
    router.push(`/reservations?date=${reservationDate}`);
  }

  // 入力値と変更用の関数をReservationFormへ渡す
  return (
    <>
      {recovery.error && !recovery.uncertain && (
        <p role="alert">{recovery.error}</p>
      )}
      {recovery.uncertain && (
        <CreationRecoveryNotice
          noun="予約"
          {...recovery}
          found={Boolean(recovery.found)}
          busy={isSubmitting}
          onCheck={() => void recovery.check()}
          onRetry={() => void handleSubmit(true)}
          onFound={() => {
            if (recovery.found) {
              const id = recovery.found.data.reservation.id;
              recovery.complete();
              router.replace(`/reservations/detail/${id}`);
            }
          }}
        />
      )}
      <ReservationForm
        values={values}
        onChange={setValues}
        requestedRestaurantMasterTypes={requestedRestaurantMasterTypes}
        reservationRoutes={reservationRoutes}
        menuTypes={menuTypes}
        reservationOccasion={reservationOccasions}
        reservationStatuses={reservationStatuses}
        onSubmit={() => void handleSubmit()}
        errorMessage={errorMessage}
        isSubmitting={isSubmitting || created || !recovery.ready}
        customerQuery={customerQuery}
        customers={customers}
        customerSearchPagination={customerSearchPagination}
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
        unavailableRestaurantMasterIds={unavailableRestaurantMasterIds}
        isAvailabilityLoading={isAvailabilityLoading}
        availabilityErrorMessage={availabilityErrorMessage}
      />
      <ReservationOverlapDialog
        open={overlapDialogOpen}
        onOpenChange={setOverlapDialogOpen}
        onViewReservations={handleViewReservations}
      />
    </>
  );
}

// 選択肢の取得完了後に一度だけ入力状態を作り、effectで利用者の入力を上書きしない。
export function NewReservationFormContainer(
  props: NewReservationFormContainerProps,
) {
  const options = useReservationFormOptions();
  if (options.isLoading)
    return <p role="status">予約の選択肢を読み込んでいます。</p>;
  if (options.errorMessage) return <p role="alert">{options.errorMessage}</p>;
  return <NewReservationFormContent {...props} options={options} />;
}
