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
export function createReservation(payload: ReservationCreateRequest) {
  return apiFetch<ReservationResponse>(RESERVATIONS_PATH, {
    method: "POST",
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
) {
  return apiFetch<ReservationResponse>(`${RESERVATIONS_PATH}/${id}/complete`, {
    method: "PATCH",
    body: payload,
  });
}

// 指定された予約の対応完了を取り消す。
export function reopenReservation(
  id: number,
  payload: ReservationStatusActionRequest,
) {
  return apiFetch<ReservationResponse>(`${RESERVATIONS_PATH}/${id}/reopen`, {
    method: "PATCH",
    body: payload,
  });
}

// 指定された予約をキャンセルする。
export function cancelReservation(
  id: number,
  payload: ReservationStatusActionRequest,
) {
  return apiFetch<ReservationResponse>(`${RESERVATIONS_PATH}/${id}/cancel`, {
    method: "PATCH",
    body: payload,
  });
}

// 指定された予約のキャンセルを取り消す。
export function restoreReservation(
  id: number,
  payload: ReservationStatusActionRequest,
) {
  return apiFetch<ReservationResponse>(`${RESERVATIONS_PATH}/${id}/restore`, {
    method: "PATCH",
    body: payload,
  });
}
