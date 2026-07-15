"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";
import { Reservation } from "@/features/reservations/type";
import { fetchReservations } from "@/features/reservations/api/reservation_api";

type ReservationListPageProps = {
  targetDate: string;
};

export function ReservationListPage({ targetDate }: ReservationListPageProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReservations() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchReservations(
          {
            date: targetDate,
          },
          controller.signal,
        );

        setReservations(response.data.reservations);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        if (error instanceof ApiClientError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("予約一覧の取得中に予期しないエラーが発生しました。");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadReservations();

    return () => {
      controller.abort();
    };
  }, [targetDate]);

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm">
        予約一覧を読み込んでいます...
      </p>
    );
  }

  if (errorMessage) {
    return (
      <div
        role="alert"
        className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-4 text-sm"
      >
        {errorMessage}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        この日の予約はありません。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => (
        <article key={reservation.id} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="font-medium">{reservation.reservation_name}</p>

            <p className="text-muted-foreground text-sm">
              {reservation.guest_count}名
            </p>
          </div>

          <p className="text-muted-foreground mt-2 text-sm">
            {formatReservationTime(reservation.starts_at)}
            {" 〜 "}
            {formatReservationTime(reservation.ends_at)}
          </p>

          <p className="text-muted-foreground mt-1 text-sm">
            席：
            {reservation.restaurant_masters.length > 0
              ? reservation.restaurant_masters
                  .map((restaurantMaster) => restaurantMaster.name)
                  .join("、")
              : "未割当"}
          </p>
        </article>
      ))}
    </div>
  );
}

function formatReservationTime(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
