import Link from "next/link";

import { ReservationStatusActions } from "@/features/reservations/components/details/ReservationStatusActions";
import type { Reservation } from "@/features/reservations/types";
import { formatReservationTime } from "@/features/reservations/utils/reservation-date";

type CanceledReservationListProps = {
  reservations: Reservation[];
  onReservationStatusChanged?: () => void;
};

export function CanceledReservationList({
  reservations,
  onReservationStatusChanged,
}: CanceledReservationListProps) {
  return (
    <section
      aria-labelledby="canceled-reservation-heading"
      className="rounded-lg border bg-card"
    >
      <div className="border-b px-4 py-3">
        <h2 id="canceled-reservation-heading" className="font-semibold">
          キャンセル済み予約
        </h2>

        <p className="text-sm text-muted-foreground">
          キャンセルした予約の確認と復元ができます。
        </p>
      </div>

      {reservations.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          キャンセル済みの予約はありません。
        </p>
      ) : (
        <ul className="divide-y">
          {reservations.map((reservation) => (
            <li
              key={reservation.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <Link
                  href={`/reservations/${reservation.id}`}
                  aria-label={`${reservation.reservation_name}様の予約詳細を開く`}
                  className="font-medium hover:underline"
                >
                  {reservation.reservation_name}
                </Link>

                <p className="text-sm text-muted-foreground">
                  <span>{reservation.guest_count}名</span>
                  {" / "}
                  <span>
                    {formatReservationTime(reservation.starts_at)}〜
                    {formatReservationTime(reservation.ends_at)}
                  </span>
                </p>
              </div>

              <ReservationStatusActions
                reservation={reservation}
                onStatusChanged={onReservationStatusChanged}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
