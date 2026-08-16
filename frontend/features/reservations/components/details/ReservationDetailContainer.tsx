"use client";
import { useReservation } from "../../hooks/useReservation";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type ReservationDetailContainerProps = {
  reservationId: number;
};

// 詳細ページから受け取った予約IDを使い、予約詳細を表示する。
export function ReservationDetailContainer({
  reservationId,
}: ReservationDetailContainerProps) {
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
    <div className="p-6">
      <div className="flex items-center justify-between">
        <Button asChild>
          <Link href={`/reservations/${reservation.id}/edit`}>編集する</Link>
        </Button>
      </div>
      <dl className="mt-6 space-y-4">
        <div>
          <dt className="text-sm text-muted-foreground">予約者名</dt>
          <dd className="font-medium">{reservation.reservation_name}</dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">電話番号</dt>
          <dd className="font-medium">
            {reservation.reservation_phone_number || "登録なし"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">予約人数</dt>
          <dd className="font-medium">{reservation.guest_count}名</dd>
        </div>
      </dl>
    </div>
  );
}
