import { apiFetch } from "@/lib/api/api-client";
import type {
  ReservationCreateRequest,
  ReservationListParams,
  ReservationListResponse,
  ReservationResponse,
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
