"use client";

import { useEffect, useState } from "react";

import type { Reservation } from "../types";
import { fetchReservation } from "../api/reservation_api";
import { ApiClientError } from "@/lib/api/api-client";

type UseReservationResult = {
  reservation: Reservation | null;
  isLoading: boolean;
  errorMessage: string | null;
};

// 予約IDを指定して予約情報を取得する。
export function useReservation(reservationId: number): UseReservationResult {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 予約IDが変更された場合は、前回の予約情報を破棄して再取得する。
  useEffect(() => {
    const controller = new AbortController();

    async function loadReservation() {
      setIsLoading(true);
      setErrorMessage(null);
      setReservation(null);

      try {
        const response = await fetchReservation(
          reservationId,
          controller.signal,
        );

        setReservation(response.data.reservation);
      } catch (error) {
        // 画面遷移により通信を中断した場合はエラー表示しない。
        if (controller.signal.aborted) return;

        if (error instanceof ApiClientError) {
          if (error.status === 404) {
            setErrorMessage("指定された予約が見つかりませんでした。");
            return;
          }

          setErrorMessage(error.message);
          return;
        }

        setErrorMessage("予約情報の取得中に予期しないエラーが発生しました。");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadReservation();

    return () => {
      controller.abort();
    };
  }, [reservationId]);

  return {
    reservation,
    isLoading,
    errorMessage,
  };
}
