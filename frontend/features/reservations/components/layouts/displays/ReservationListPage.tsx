"use client";

import { useEffect, useMemo, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";
import { Reservation } from "@/features/reservations/types";
import { fetchReservations } from "@/features/reservations/api/reservation_api";
import { fetchRestaurantMasters } from "@/features/restaurant-masters/api/restaurant-masters-api";
import { RestaurantMaster } from "@/features/restaurant-masters/types";
import {
  buildReservationTableRows,
  findUnassignedReservations,
} from "@/features/reservations/utils/reservation-table-rows";
import { ReservationTimeline } from "./ReservationTimeline";

type ReservationListPageProps = {
  targetDate: string;
};

export function ReservationListPage({ targetDate }: ReservationListPageProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [restaurantMasters, setRestaurantMasters] = useState<
    RestaurantMaster[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReservationData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [reservationsResponse, restaurantMastersResponse] =
          await Promise.all([
            fetchReservations(
              {
                date: targetDate,
              },
              controller.signal,
            ),
            fetchRestaurantMasters(controller.signal),
          ]);

        setReservations(reservationsResponse.data.reservations);
        setRestaurantMasters(restaurantMastersResponse.data.restaurant_masters);
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

    void loadReservationData();

    return () => {
      controller.abort();
    };
  }, [targetDate]);

  const tableRows = useMemo(
    () => buildReservationTableRows(restaurantMasters, reservations),
    [restaurantMasters, reservations],
  );

  const unassignedReservations = useMemo(
    () => findUnassignedReservations(reservations),
    [reservations],
  );

  // 表示日の予約件数を集計する。
  const reservationCount = reservations.length;

  // 表示日の来店予定人数を集計する。
  // 初期値を0にすることで、予約がない日も0名として扱える。
  const totalGuestCount = reservations.reduce(
    (total, reservation) => total + reservation.guest_count,
    0,
  );

  // 実テーブルがまだ割り当てられていない予約件数を集計する。
  const unassignedReservationCount = unassignedReservations.length;

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm">
        予約状況を読み込んでいます...
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

  return (
    <div>
      <section aria-labelledby="reservation-summary-heading">
        <h2 id="reservation-summary-heading" className="sr-only">
          表示日の予約サマリー
        </h2>

        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <dt className="text-sm text-muted-foreground">予約件数</dt>
            <dd className="mt-1 text-2xl font-semibold">
              {reservationCount}件
            </dd>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <dt className="text-sm text-muted-foreground">来店予定人数</dt>
            <dd className="mt-1 text-2xl font-semibold">{totalGuestCount}名</dd>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <dt className="text-sm text-muted-foreground">席未割当</dt>
            <dd className="mt-1 text-2xl font-semibold">
              {unassignedReservationCount}件
            </dd>
          </div>
        </dl>
      </section>

      <ReservationTimeline
        tableRows={tableRows}
        unassignedReservations={unassignedReservations}
        targetDate={targetDate}
      />

      {unassignedReservations.length > 0 ? (
        <section className="grid gap-3 rounded-lg border border-dashed p-4 md:grid-cols-[180px_1fr]">
          <div>
            <p className="font-medium">席未割当</p>

            <p className="text-muted-foreground text-sm">実テーブル未確定</p>
          </div>

          <ReservationRowContent reservations={unassignedReservations} />
        </section>
      ) : null}
    </div>
  );
}

type ReservationRowContentProps = {
  reservations: Reservation[];
};

function ReservationRowContent({ reservations }: ReservationRowContentProps) {
  if (reservations.length === 0) {
    return (
      <p className="text-muted-foreground self-center text-sm">予約なし</p>
    );
  }

  return (
    <div className="space-y-2">
      {reservations.map((reservation) => (
        <article
          key={reservation.id}
          className="bg-muted/40 rounded-md border p-3"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-medium">{reservation.reservation_name}</p>

            <p className="text-muted-foreground text-sm">
              {reservation.guest_count}名
            </p>
          </div>

          <p className="text-muted-foreground mt-1 text-sm">
            {formatReservationTime(reservation.starts_at)}
            {" 〜 "}
            {formatReservationTime(reservation.ends_at)}
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
