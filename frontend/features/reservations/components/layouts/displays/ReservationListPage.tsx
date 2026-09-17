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
import { UnassignedReservationList } from "./UnassignedReservationList";
import { useCurrentTime } from "@/features/reservations/hooks/useCurrentTime";
import { CanceledReservationDrawer } from "./CanceledReservationDrawer";

type ReservationListPageProps = {
  targetDate: string;
};

export function ReservationListPage({ targetDate }: ReservationListPageProps) {
  const currentTime = useCurrentTime();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [restaurantMasters, setRestaurantMasters] = useState<
    RestaurantMaster[]
  >([]);
  const [canceledReservations, setCanceledReservations] = useState<
    Reservation[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReservationData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [
          reservationsResponse,
          canceledReservationsResponse,
          restaurantMastersResponse,
        ] = await Promise.all([
          fetchReservations(
            {
              date: targetDate,
              state: "active",
            },
            controller.signal,
          ),
          fetchReservations(
            {
              date: targetDate,
              state: "canceled",
            },
            controller.signal,
          ),
          fetchRestaurantMasters(controller.signal),
        ]);

        setReservations(reservationsResponse.data.reservations);
        setCanceledReservations(canceledReservationsResponse.data.reservations);
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
  }, [targetDate, reloadKey]);

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
    <div className="space-y-4">
      <section aria-labelledby="reservation-summary-heading">
        <h2 id="reservation-summary-heading" className="sr-only">
          表示日の予約サマリー
        </h2>

        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

          <div
            className="
            group relative rounded-lg border bg-card p-4 pr-12
            transition-[transform,box-shadow,background-color,border-color]
            hover:-translate-y-0.5 hover:border-foreground/20
            hover:bg-accent/40 hover:shadow-sm
            active:translate-y-0 active:shadow-none
            focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
            "
          >
            <dt className="text-sm text-muted-foreground">キャンセル済み</dt>

            <dd className="mt-1">
              <CanceledReservationDrawer
                reservations={canceledReservations}
                onReservationStatusChanged={() => {
                  setReloadKey((current) => current + 1);
                }}
              />
            </dd>
          </div>
        </dl>
      </section>

      <UnassignedReservationList reservations={unassignedReservations} />

      <ReservationTimeline
        tableRows={tableRows}
        targetDate={targetDate}
        currentTime={currentTime}
        onReservationStatusChanged={() => {
          setReloadKey((current) => current + 1);
        }}
      />
    </div>
  );
}
