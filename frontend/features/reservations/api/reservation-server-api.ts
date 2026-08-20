import "server-only";

import { headers } from "next/headers";

import type { ReservationResponse } from "../types";

const RAILS_API_URL = process.env.RAILS_API_URL;
const RESERVATIONS_PATH = "/api/v1/reservations";

export class ReservationServerApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ReservationServerApiError";
    this.status = status;
  }
}

// Server ComponentからRailsへ接続し、指定された予約を取得する。
export async function fetchReservationOnServer(
  reservationId: number,
): Promise<ReservationResponse> {
  if (!RAILS_API_URL) {
    throw new Error("RAILS_API_URL is not defined");
  }

  // ブラウザからNext.jsへ送られたログインCookieをRailsへ引き継ぐ。
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie");

  const response = await fetch(
    `${RAILS_API_URL}${RESERVATIONS_PATH}/${reservationId}`,
    {
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ReservationServerApiError(
      "予約情報を取得できませんでした。",
      response.status,
    );
  }

  return (await response.json()) as ReservationResponse;
}
