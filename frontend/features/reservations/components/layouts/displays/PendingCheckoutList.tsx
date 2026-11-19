"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import { fetchReservations } from "../../../api/reservation_api";
import type { ReservationListData } from "../../../types";
import { formatReservationDateTimeLocal } from "../../../utils/reservation-date";
import { ReservationStatusActions } from "../../details/ReservationStatusActions";

// 予定終了を過ぎた予約は自動完了せず、過去日を含めてスタッフが確認する。
export function PendingCheckoutList() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<ReservationListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchReservations(
          { state: "pending_checkout", page, per_page: 20 },
          controller.signal,
        );
        if (!controller.signal.aborted) setData(response.data);
      } catch {
        if (!controller.signal.aborted)
          setError("退店未処理の予約を取得できませんでした。");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [open, page, reload]);
  return (
    <section className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
      <Button
        variant="ghost"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        退店未処理の予約を確認
      </Button>
      {open && (
        <div className="space-y-3">
          <p className="text-sm">
            予定終了を過ぎた未処理予約です。実際の来店結果を確認して操作してください。自動では退店済みになりません。
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => setReload((value) => value + 1)}
          >
            未処理一覧を更新
          </Button>
          {loading ? (
            <p role="status">読み込み中…</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : (
            <>
              <ul className="space-y-3">
                {data?.reservations.map((reservation) => (
                  <li
                    key={reservation.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-background p-3"
                  >
                    <Link
                      className="underline"
                      href={`/reservations/detail/${reservation.id}`}
                    >
                      {reservation.reservation_name} ／{" "}
                      {formatReservationDateTimeLocal(
                        reservation.starts_at,
                      ).replace("T", " ")}{" "}
                      ／ {reservation.reservation_status?.label}
                    </Link>
                    <ReservationStatusActions
                      reservation={reservation}
                      onStatusChanged={() => setReload((value) => value + 1)}
                    />
                  </li>
                ))}
              </ul>
              {data?.reservations.length === 0 && (
                <p>退店未処理の予約はありません。</p>
              )}
              {data?.pagination && (
                <PaginationControls
                  currentPage={page}
                  totalPages={data.pagination.total_pages}
                  totalCount={data.pagination.total_count}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
