import { apiFetch } from "@/lib/api/api-client";
import type {
  ReservationCreateRequest,
  ReservationListParams,
  ReservationListResponse,
  ReservationResponse,
  ReservationUpdateRequest,
  ReservationStatusActionRequest,
} from "../types";

const RESERVATIONS_PATH = "/api/v1/reservations";

// 予約一覧APIのURLを生成する。
function buildReservationsPath(params: ReservationListParams = {}): string {
  const searchParams = new URLSearchParams();

  if (params.date) {
    searchParams.set("date", params.date);
  }

  if (params.state) {
    searchParams.set("state", params.state);
  }

  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));
  const queryString = searchParams.toString();

  return queryString
    ? `${RESERVATIONS_PATH}?${queryString}`
    : RESERVATIONS_PATH;
}

// 指定日の予約一覧を取得する。
export function fetchReservations(
  params: ReservationListParams = {},
  signal?: AbortSignal,
) {
  return apiFetch<ReservationListResponse>(buildReservationsPath(params), {
    cache: "no-store",
    signal,
  });
}

// 予約を登録する。
export function createReservation(
  payload: ReservationCreateRequest,
  idempotencyKey: string,
) {
  return apiFetch<ReservationResponse>(RESERVATIONS_PATH, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: payload,
  });
}

// 指定されたIDの予約を1件取得する。
export function fetchReservation(id: number, signal?: AbortSignal) {
  return apiFetch<ReservationResponse>(`${RESERVATIONS_PATH}/${id}`, {
    cache: "no-store",
    signal,
  });
}

// 指定されたIDの予約を更新する。
export function updateReservation(
  id: number,
  payload: ReservationUpdateRequest,
) {
  return apiFetch<ReservationResponse>(`${RESERVATIONS_PATH}/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

// 指定された予約を対応完了にする。
export function completeReservation(
  id: number,
  payload: ReservationStatusActionRequest,
  idempotencyKey: string,
) {
  return apiFetch<ReservationResponse>(`${RESERVATIONS_PATH}/${id}/complete`, {
    method: "PATCH",
    headers: { "Idempotency-Key": idempotencyKey },
    body: payload,
  });
}

// 指定された予約の対応完了を取り消す。
export function reopenReservation(
  id: number,
  payload: ReservationStatusActionRequest,
  idempotencyKey: string,
) {
  return apiFetch<ReservationResponse>(`${RESERVATIONS_PATH}/${id}/reopen`, {
    method: "PATCH",
    headers: { "Idempotency-Key": idempotencyKey },
    body: payload,
  });
}

// 指定された予約をキャンセルする。
export function cancelReservation(
  id: number,
  payload: ReservationStatusActionRequest,
  idempotencyKey: string,
) {
  return apiFetch<ReservationResponse>(`${RESERVATIONS_PATH}/${id}/cancel`, {
    method: "PATCH",
    headers: { "Idempotency-Key": idempotencyKey },
    body: payload,
  });
}

// 指定された予約のキャンセルを取り消す。
export function restoreReservation(
  id: number,
  payload: ReservationStatusActionRequest,
  idempotencyKey: string,
) {
  return apiFetch<ReservationResponse>(`${RESERVATIONS_PATH}/${id}/restore`, {
    method: "PATCH",
    headers: { "Idempotency-Key": idempotencyKey },
    body: payload,
  });
}

export function confirmReservationDetails(
  id: number,
  payload: ReservationStatusActionRequest,
) {
  return apiFetch<ReservationResponse>(
    `${RESERVATIONS_PATH}/${id}/confirm_details`,
    { method: "PATCH", body: payload },
  );
}

// 来店結果の訂正を一度の操作として送り、再送には同じキーを使う。
export function correctReservationResult(
  id: number,
  payload: ReservationStatusActionRequest,
  idempotencyKey: string,
) {
  return apiFetch<ReservationResponse>(
    `${RESERVATIONS_PATH}/${id}/correct_result`,
    {
      method: "PATCH",
      headers: { "Idempotency-Key": idempotencyKey },
      body: payload,
    },
  );
}

// 開始時刻を過ぎた予約を無断キャンセルとして記録する。
export function noShowReservation(
  id: number,
  payload: ReservationStatusActionRequest,
  idempotencyKey: string,
) {
  return apiFetch<ReservationResponse>(`${RESERVATIONS_PATH}/${id}/no_show`, {
    method: "PATCH",
    headers: { "Idempotency-Key": idempotencyKey },
    body: payload,
  });
}

// 変更前後・担当者・日時を追跡するための来店結果履歴を取得する。
export function fetchReservationResultChanges(
  id: number,
  page = 1,
  signal?: AbortSignal,
) {
  return apiFetch<
    import("@/lib/api/api-client").ApiSuccessResponse<
      import("../types").ReservationResultChangesData
    >
  >(`${RESERVATIONS_PATH}/${id}/result_changes?page=${page}&per_page=20`, {
    cache: "no-store",
    signal,
  });
}
