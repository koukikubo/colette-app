"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDaysIcon, RefreshCwIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import { usePagination } from "@/hooks/usePagination";
import type { Pagination } from "@/lib/api/pagination";
import type { Reservation } from "@/features/reservations/types";
import { formatReservationTime } from "@/features/reservations/utils/reservation-date";

import { fetchCustomerReservations } from "../../api/customer-api";

type CustomerReservationHistoryProps = {
  customerId: number;
};

function formatReservationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function reservationTableNames(reservation: Reservation) {
  if (reservation.restaurant_masters.length === 0) {
    return "席未割当";
  }

  return reservation.restaurant_masters
    .map((restaurantMaster) => restaurantMaster.name)
    .join("、");
}

function reservationStatusLabel(reservation: Reservation) {
  return reservation.reservation_status?.label ?? "状態不明";
}

export function CustomerReservationHistory({
  customerId,
}: CustomerReservationHistoryProps) {
  const { currentPage, perPage, setCurrentPage } = usePagination();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadReservations() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchCustomerReservations(customerId, {
          page: currentPage,
          per_page: perPage,
        });

        if (isCancelled) {
          return;
        }

        setReservations(response.data.reservations);
        setPagination(response.data.pagination);
      } catch {
        if (isCancelled) {
          return;
        }

        setErrorMessage("予約履歴を取得できませんでした。");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadReservations();

    return () => {
      isCancelled = true;
    };
  }, [customerId, currentPage, perPage, reloadKey]);

  function handleRetry() {
    setReloadKey((current) => current + 1);
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        予約履歴を読み込んでいます...
      </p>
    );
  }

  if (errorMessage) {
    return (
      <Alert variant="destructive">
        <AlertTitle>予約履歴を表示できません</AlertTitle>

        <AlertDescription>
          <p>{errorMessage}</p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleRetry}
          >
            <RefreshCwIcon aria-hidden="true" />
            再読み込み
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <section aria-labelledby="customer-reservation-history-heading">
      <Card className="gap-0 py-0">
        <CardHeader className="block border-b px-4 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <CalendarDaysIcon className="size-5" aria-hidden="true" />
            </div>

            <div>
              <h2
                id="customer-reservation-history-heading"
                className="font-semibold"
              >
                予約履歴
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                この顧客に紐づく予約を新しい順に表示します。
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {reservations.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              この顧客の予約履歴はありません。
            </p>
          ) : (
            <ul className="divide-y">
              {reservations.map((reservation) => (
                <li
                  key={reservation.id}
                  className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">予約日</p>

                      <p className="mt-1 text-sm font-medium">
                        {formatReservationDate(reservation.starts_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">予約時間</p>

                      <p className="mt-1 text-sm font-medium">
                        {formatReservationTime(reservation.starts_at)}〜
                        {formatReservationTime(reservation.ends_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        人数・割当席
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        <span>{reservation.guest_count}名</span>
                        {" / "}
                        <span>{reservationTableNames(reservation)}</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">予約状態</p>

                      <div className="mt-1">
                        <Badge variant="outline">
                          {reservationStatusLabel(reservation)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/reservations/${reservation.id}`}
                      aria-label={`予約${reservation.id}の詳細を開く`}
                    >
                      予約詳細
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>

        {pagination && pagination.total_count > 0 && (
          <CardFooter>
            <PaginationControls
              className="w-full"
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              totalCount={pagination.total_count}
              onPageChange={setCurrentPage}
            />
          </CardFooter>
        )}
      </Card>
    </section>
  );
}
