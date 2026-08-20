// 開始・終了日時が揃ったらAPIを呼ぶ
// 日時変更時に再取得する
// 短時間の連続変更を抑える
// 古い通信をAbortControllerで中断する
// 予約済みテーブルIDを保持する
// 読み込み状態とエラーを管理する

"use client";

import { useEffect, useState } from "react";

import { fetchRestaurantMasterAvailabilities } from "@/features/restaurant-masters/api/restaurant-masters-api";
import { ApiClientError } from "@/lib/api/api-client";

type UseRestaurantMasterAvailabilityParams = {
  startsAt: string;
  endsAt: string;
  reservationId?: number;
};

type UseRestaurantMasterAvailabilityResult = {
  unavailableRestaurantMasterIds: number[];
  isAvailabilityLoading: boolean;
  availabilityErrorMessage: string | null;
};

// 入力中の予約時間に使用できない実テーブルを取得する。
export function useRestaurantMasterAvailability({
  startsAt,
  endsAt,
  reservationId,
}: UseRestaurantMasterAvailabilityParams): UseRestaurantMasterAvailabilityResult {
  const [unavailableRestaurantMasterIds, setUnavailableRestaurantMasterIds] =
    useState<number[]>([]);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [availabilityErrorMessage, setAvailabilityErrorMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAvailability() {
      // 日時が未入力または前後関係が不正な間はAPIを呼び出さない。
      if (!startsAt || !endsAt || endsAt <= startsAt) {
        setUnavailableRestaurantMasterIds([]);
        setIsAvailabilityLoading(false);
        setAvailabilityErrorMessage(null);
        return;
      }

      setUnavailableRestaurantMasterIds([]);
      setIsAvailabilityLoading(true);
      setAvailabilityErrorMessage(null);

      try {
        const response = await fetchRestaurantMasterAvailabilities(
          {
            starts_at: startsAt,
            ends_at: endsAt,
            reservation_id: reservationId,
          },
          controller.signal,
        );

        setUnavailableRestaurantMasterIds(
          response.data.unavailable_restaurant_master_ids,
        );
      } catch (error) {
        // 日時変更や画面遷移による通信中断はエラー表示しない。
        if (controller.signal.aborted) return;

        setUnavailableRestaurantMasterIds([]);

        setAvailabilityErrorMessage(
          error instanceof ApiClientError
            ? error.message
            : "実テーブルの空き状況を取得できませんでした。",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsAvailabilityLoading(false);
        }
      }
    }

    // 日時入力中の連続通信を抑えるため、少し待ってから取得する。
    const timeoutId = window.setTimeout(() => {
      void loadAvailability();
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [startsAt, endsAt, reservationId]);

  return {
    unavailableRestaurantMasterIds,
    isAvailabilityLoading,
    availabilityErrorMessage,
  };
}
