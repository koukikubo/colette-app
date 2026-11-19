"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import { fetchReservationResultChanges } from "../../api/reservation_api";
import type {
  ReservationResultChangesData,
  ReservationResultSnapshot,
} from "../../types";

function resultLabel(state: ReservationResultSnapshot) {
  return state.canceled_at
    ? state.cancellation_kind === "no_show"
      ? "無断キャンセル"
      : "キャンセル"
    : state.completed_at
      ? "退店済"
      : "未退店";
}

// 履歴は必要なときに取得し、予約の保存結果とは独立して再試行できるようにする。
export function ReservationResultHistory({
  reservationId,
  version,
}: {
  reservationId: number;
  version: number;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<ReservationResultChangesData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const response = await fetchReservationResultChanges(
          reservationId,
          page,
          controller.signal,
        );
        if (!controller.signal.aborted) setData(response.data);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [open, page, retry, reservationId, version]);
  return (
    <section className="space-y-3 border-t px-5 py-4">
      <Button
        variant="ghost"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        来店結果の変更履歴
      </Button>
      {open &&
        (loading ? (
          <p role="status">履歴を読み込み中…</p>
        ) : error ? (
          <div role="alert">
            履歴を取得できませんでした。
            <Button
              variant="outline"
              onClick={() => setRetry((value) => value + 1)}
            >
              履歴を再取得
            </Button>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {data?.changes.map((event) => (
                <li
                  key={event.id}
                  className="rounded-md bg-muted/40 p-3 text-sm"
                >
                  <p>
                    {resultLabel(event.before_state)} →{" "}
                    {resultLabel(event.after_state)}
                  </p>
                  <p>
                    {event.staff_name ?? "担当者名未設定"} ／{" "}
                    {new Date(event.created_at).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })}
                  </p>
                  <p>理由：{event.reason || "入力なし"}</p>
                  {event.before_state.customer_id !==
                    event.after_state.customer_id && <p>顧客の紐付けを訂正</p>}
                  {(event.before_state.starts_at !==
                    event.after_state.starts_at ||
                    event.before_state.ends_at !==
                      event.after_state.ends_at) && <p>予約予定日時を訂正</p>}
                  {event.before_state.guest_count !==
                    event.after_state.guest_count && (
                    <p>
                      人数：{event.before_state.guest_count}名 →{" "}
                      {event.after_state.guest_count}名
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {data?.changes.length === 0 && (
              <p className="text-sm">
                変更履歴はありません。導入前の操作履歴は含みません。
              </p>
            )}
            {data && (
              <PaginationControls
                currentPage={page}
                totalCount={data.pagination.total_count}
                totalPages={data.pagination.total_pages}
                onPageChange={setPage}
              />
            )}
          </>
        ))}
    </section>
  );
}
