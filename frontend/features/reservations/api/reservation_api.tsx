import { apiFetch } from "@/lib/api/api-client";
import { ReservationListParams, ReservationListResponse } from "../type";

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
