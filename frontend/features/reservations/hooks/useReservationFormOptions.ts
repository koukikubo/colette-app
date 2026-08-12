"use client";

import type { RestaurantMaster } from "@/features/restaurant-masters/types";
import type {
  StandardCode,
  StandardListCode,
} from "@/features/standard-codes/types";

import { useState } from "react";
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

export function useReservationFormOptions(): UseReservationFormOptionsResult {
  const [standardCodes] = useState<StandardCode[]>([]);
  const [restaurantMasters] = useState<RestaurantMaster[]>([]);
  const [isLoading] = useState(false);
  const [errorMessage] = useState<string | null>(null);

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
