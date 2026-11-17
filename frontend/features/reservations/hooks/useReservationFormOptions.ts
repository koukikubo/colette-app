"use client";
import { useState, useEffect } from "react";
import { ApiClientError } from "@/lib/api/api-client";
import { useSessionReadRetry } from "@/hooks/useSessionReadRetry";

import type { RestaurantMaster } from "@/features/restaurant-masters/types";
import type {
  StandardCode,
  StandardListCode,
} from "@/features/standard-codes/types";

import { fetchRestaurantMasters } from "@/features/restaurant-masters/api/restaurant-masters-api";
import { fetchStandardCodes } from "@/features/standard-codes/api/standard-code-api";

// 予約フォームで利用する各種マスタ情報を取得するカスタムフック
export type UseReservationFormOptionsResult = {
  requestedRestaurantMasterTypes: StandardListCode[];
  reservationRoutes: StandardListCode[];
  menuTypes: StandardListCode[];
  reservationOccasions: StandardListCode[];
  reservationStatuses: StandardListCode[];

  restaurantMasters: RestaurantMaster[];

  isLoading: boolean;
  errorMessage: string | null;
};

// 予約（新規登録・編集）フォームで共通使用する基本コードマスタ情報を取得する。
export function useReservationFormOptions(): UseReservationFormOptionsResult {
  const [standardCodes, setStandardCodes] = useState<StandardCode[]>([]);
  const [restaurantMasters, setRestaurantMasters] = useState<
    RestaurantMaster[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [unauthorized, setUnauthorized] = useState(false);
  const recoveryRevision = useSessionReadRetry(unauthorized);

  // 予約フォームの初回表示に選択肢として使用する必要なコード情報を取得する。
  useEffect(() => {
    // 画面遷移などでフォームが破棄された場合に、実行中の通信とその後のState更新を止めるために使用する。
    const controller = new AbortController();

    async function loadOptions() {
      setIsLoading(true);
      setErrorMessage(null);
      setUnauthorized(false);

      try {
        // 基本コードと席マスタは互いに依存しないため、並列で取得する。
        const [standardCodesResponse, restaurantMastersResponse] =
          await Promise.all([
            fetchStandardCodes(controller.signal),
            fetchRestaurantMasters(controller.signal),
          ]);

        setStandardCodes(standardCodesResponse.data.standard_masters);
        // 無効な席は除外しない。編集時にはその時点のマスタ情報から選択肢を選択できる形式が好ましいため、全件取得する。
        setRestaurantMasters(restaurantMastersResponse.data.restaurant_masters);
      } catch (error) {
        // 画面遷移による通信キャンセルは取得失敗として扱わない。
        if (controller.signal.aborted) return;
        setUnauthorized(
          error instanceof ApiClientError && error.status === 401,
        );
        setErrorMessage("予約フォームのマスタ情報を取得できませんでした。");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadOptions();

    return () => {
      controller.abort();
    };
  }, [recoveryRevision]);

  // standardCodes から system_key が指定されたものを探し、有効なアイテムのみを返す。
  function findActiveStandardListCodes(systemKey: string): StandardListCode[] {
    const standardCode = standardCodes.find(
      (code) => code.system_key === systemKey && code.active,
    );

    return standardCode?.items?.filter((item) => item.active) ?? [];
  }

  return {
    requestedRestaurantMasterTypes: findActiveStandardListCodes(
      "restaurant_master_type",
    ),

    reservationRoutes: findActiveStandardListCodes("reservation_route"),
    menuTypes: findActiveStandardListCodes("reservation_menu_type"),
    reservationOccasions: findActiveStandardListCodes("reservation_occasion"),
    reservationStatuses: findActiveStandardListCodes("reservation_status"),

    restaurantMasters,
    isLoading,
    errorMessage,
  };
}
