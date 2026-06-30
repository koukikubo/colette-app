import { apiFetch } from "@/lib/api/api-client";

import type {
  CreateRestaurantMasterRequest,
  RestaurantMasterResponse,
  RestaurantMastersResponse,
  UpdateRestaurantMasterRequest,
} from "../types";

const restaurant_masterS_API_PATH = "/api/v1/restaurant_masters";

/*席マスタ一覧を取得する*/
export function fetchRestaurantMasters() {
  return apiFetch<RestaurantMastersResponse>(restaurant_masterS_API_PATH, {
    method: "GET",
  });
}

/*指定した席マスタの詳細を取得する*/
export function fetchRestaurantMaster(id: number | string) {
  const encodedId = encodeURIComponent(String(id));

  return apiFetch<RestaurantMasterResponse>(
    `${restaurant_masterS_API_PATH}/${encodedId}`,
    {
      method: "GET",
    },
  );
}

/*席マスタを登録する*/
export function createRestaurantMaster(payload: CreateRestaurantMasterRequest) {
  return apiFetch<RestaurantMasterResponse>(restaurant_masterS_API_PATH, {
    method: "POST",
    body: payload,
  });
}

/*席マスタを更新する*/
export function updateRestaurantMaster(
  id: number | string,
  payload: UpdateRestaurantMasterRequest,
) {
  const encodedId = encodeURIComponent(String(id));

  return apiFetch<RestaurantMasterResponse>(
    `${restaurant_masterS_API_PATH}/${encodedId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}
