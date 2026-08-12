"use client";
import { useState, useEffect } from "react";

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

// 予約フォームで利用する各種マスタ情報を取得するカスタムフック
export function useReservationFormOptions(): UseReservationFormOptionsResult {
  const [standardCodes, setStandardCodes] = useState<StandardCode[]>([]);
  const [restaurantMasters, setRestaurantMasters] = useState<
    RestaurantMaster[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 予約フォームで利用する各種マスタ情報を取得する
  useEffect(() => {
    const controller = new AbortController();

    async function loadOptions() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [standardCodesResponse, restaurantMastersResponse] =
          await Promise.all([
            fetchStandardCodes(controller.signal),
            fetchRestaurantMasters(controller.signal),
          ]);

        setStandardCodes(standardCodesResponse.data.standard_masters);

        setRestaurantMasters(restaurantMastersResponse.data.restaurant_masters);
      } catch {
        if (controller.signal.aborted) return;
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
  }, []);

  // standardCodes から system_key が指定されたものを探し、有効なアイテムのみを返す
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
