import Link from "next/link";
import { ArrowRightIcon, PencilIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Reservation } from "@/features/reservations/types";
import { formatReservationTime } from "@/features/reservations/utils/reservation-date";

type UnassignedReservationListProps = {
  reservations: Reservation[];
};

// 実テーブルの割り当てが必要な予約を、対応対象として一覧表示する。
export function UnassignedReservationList({
  reservations,
}: UnassignedReservationListProps) {
  // 対応が必要な予約がなければ、セクション自体を表示しない。
  if (reservations.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="unassigned-reservations-heading"
      className="rounded-lg border border-amber-300 bg-amber-50/60 p-4"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-amber-100 p-2 text-amber-700">
            <TriangleAlertIcon className="size-5" aria-hidden="true" />
          </div>

          <div>
            <h2 id="unassigned-reservations-heading" className="font-semibold">
              要対応：席未割当予約
            </h2>

            <p className="text-muted-foreground mt-1 text-sm">
              実テーブルが決まっていない予約を確認してください。
            </p>
          </div>
        </div>

        <p className="text-sm font-medium text-amber-800">
          {reservations.length}件
        </p>
      </div>

      <ul className="space-y-2">
        {reservations.map((reservation) => (
          <li
            key={reservation.id}
            className="bg-background grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_auto] md:items-center"
          >
            <div className="grid gap-2 sm:grid-cols-4">
              <ReservationItem
                label="予約時間"
                value={`${formatReservationTime(
                  reservation.starts_at,
                )}〜${formatReservationTime(reservation.ends_at)}`}
              />

              <ReservationItem
                label="予約者名"
                value={`${reservation.reservation_name} 様`}
              />

              <ReservationItem
                label="予約人数"
                value={`${reservation.guest_count}名`}
              />

              <ReservationItem
                label="希望席種"
                value={
                  reservation.requested_restaurant_master_type?.label ??
                  "未設定"
                }
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/reservations/${reservation.id}`}>
                  詳細
                  <ArrowRightIcon />
                </Link>
              </Button>

              <Button asChild size="sm">
                <Link href={`/reservations/${reservation.id}/edit`}>
                  <PencilIcon />
                  席を割り当てる
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

type ReservationItemProps = {
  label: string;
  value: string;
};

// 項目名と予約情報の表示形式を統一する。
function ReservationItem({ label, value }: ReservationItemProps) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
