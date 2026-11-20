import { ApiClientError } from "@/lib/api/api-client";
import {
  cancelReservation,
  completeReservation,
  fetchReservations,
  noShowReservation,
} from "../api/reservation_api";
import type { Reservation, ReservationStatusActionRequest } from "../types";

export type BulkResultAction = "checkout" | "cancel" | "no_show";
export const bulkResultLabels: Record<BulkResultAction, string> = {
  checkout: "退店済にする",
  cancel: "通常キャンセルにする",
  no_show: "無断キャンセルにする",
};
export type BulkResultItem = {
  reservation: Reservation;
  key: string;
  payload: ReservationStatusActionRequest;
  status: "pending" | "success" | "failed" | "uncertain";
  error?: string;
};

// 全選択は取得だけを行う。ページ取得に失敗した場合は部分的な選択へ置き換えない。
export async function loadPendingReservations(
  date?: string,
  signal?: AbortSignal,
): Promise<Reservation[]> {
  const selected = new Map<number, Reservation>();
  let totalPages = 1;
  let expectedCount: number | undefined;
  for (let page = 1; page <= totalPages; page++) {
    const response = await fetchReservations(
      {
        state: "pending_checkout",
        ...(date ? { date } : {}),
        page,
        per_page: 100,
      },
      signal,
    );
    // 初回に見えた範囲を上限とし、取得中に増えたページを際限なく追い続けない。
    if (page === 1) {
      totalPages = response.data.pagination?.total_pages ?? 1;
      expectedCount = response.data.pagination?.total_count;
    }
    if (
      expectedCount !== undefined &&
      response.data.pagination?.total_count !== expectedCount
    )
      throw new Error(
        "取得中に未処理件数が変更されました。再度選択してください。",
      );
    response.data.reservations.forEach((reservation) =>
      selected.set(reservation.id, reservation),
    );
  }
  if (expectedCount !== undefined && selected.size !== expectedCount)
    throw new Error("全件を取得できませんでした。再度選択してください。");
  return [...selected.values()];
}

// 確認画面を開く時点の版・本文・キーを固定する。以後の再送で作り直さない。
export function prepareBulkResults(
  reservations: Reservation[],
  action: BulkResultAction,
): BulkResultItem[] {
  return reservations.map((reservation) => ({
    reservation,
    key: crypto.randomUUID(),
    payload: {
      reservation: {
        lock_version: reservation.lock_version,
        ...(action === "checkout" &&
        reservation.reservation_status?.code === "tentative"
          ? { confirm_tentative: true }
          : {}),
      },
    },
    status: "pending",
  }));
}

// 各予約の既存APIで認可・版検証・監査・冪等性を保つ。全件を一つの保存とは扱わない。
export async function executeBulkResults(
  items: BulkResultItem[],
  action: BulkResultAction,
  onProgress: (items: BulkResultItem[]) => void,
): Promise<BulkResultItem[]> {
  const result = items.map((item) => ({ ...item }));
  const save = {
    checkout: completeReservation,
    cancel: cancelReservation,
    no_show: noShowReservation,
  }[action];
  for (const item of result) {
    if (item.status === "success" || item.status === "failed") continue;
    const wasUncertain = item.status === "uncertain";
    try {
      await save(item.reservation.id, item.payload, item.key);
      item.status = "success";
      item.error = undefined;
    } catch (error) {
      // 保存済みキー照合後の版競合だけは未保存が確定する。認証・CSRF拒否とは分ける。
      const definitiveConflict =
        error instanceof ApiClientError &&
        error.status === 409 &&
        error.code === "reservation_result_conflict";
      const ambiguous =
        (wasUncertain && !definitiveConflict) ||
        !(error instanceof ApiClientError) ||
        error.status >= 500;
      item.status = ambiguous ? "uncertain" : "failed";
      item.error =
        error instanceof ApiClientError
          ? error.message
          : "通信結果を確認できません。";
      onProgress(result.map((entry) => ({ ...entry })));
      // 応答喪失や認証拒否の後は送信を止め、同じ操作だけを明示再試行できるようにする。
      if (
        ambiguous ||
        (error instanceof ApiClientError && [401, 403].includes(error.status))
      )
        break;
      continue;
    }
    onProgress(result.map((entry) => ({ ...entry })));
  }
  return result;
}
