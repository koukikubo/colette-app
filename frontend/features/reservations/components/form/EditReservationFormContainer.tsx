"use client";

import { useState } from "react";

import { useReservation } from "../../hooks/useReservation";
import type { Reservation, ReservationFormValues } from "../../types";
import { buildEditReservationFormValues } from "../../utils/reservation-form";
import { useReservationFormOptions } from "../../hooks/useReservationFormOptions";

type EditReservationFormContentProps = {
  reservation: Reservation;
};

// 取得済みの予約から編集フォームの入力状態を作成する。
function EditReservationFormContent({
  reservation,
}: EditReservationFormContentProps) {
  const [values] = useState<ReservationFormValues>(() =>
    buildEditReservationFormValues(reservation),
  );

  const [lockVersion] = useState(reservation.lock_version);
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
    <div className="p-6">
      <p>編集対象の予約：{values.reservation_name}</p>
      <p>現在のlock_version：{lockVersion}</p>
      <p>予約状況の選択肢：{reservationStatuses.length}件</p>
      <p>予約経路の選択肢：{reservationRoutes.length}件</p>
      <p>メニューの選択肢：{menuTypes.length}件</p>
      <p>利用目的の選択肢：{reservationOccasions.length}件</p>
      <p>希望席種の選択肢：{requestedRestaurantMasterTypes.length}件</p>
    </div>
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
