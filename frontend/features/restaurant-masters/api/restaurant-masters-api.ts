import { apiFetch } from "@/lib/api/api-client";

import type {
  CreateRestaurantMasterRequest,
  RestaurantMasterAvailabilityParams,
  RestaurantMasterAvailabilityResponse,
  RestaurantMasterResponse,
  RestaurantMastersResponse,
  UpdateRestaurantMasterRequest,
} from "../types";

const RESTAURANT_MASTER_AVAILABILITIES_PATH =
  "/api/v1/restaurant_master_availabilities";

const RESTAURANT_MASTERS_API_API_PATH = "/api/v1/restaurant_masters";

/*席マスタ一覧を取得する*/
export function fetchRestaurantMasters(signal?: AbortSignal) {
  return apiFetch<RestaurantMastersResponse>(RESTAURANT_MASTERS_API_API_PATH, {
    method: "GET",
    cache: "no-store",
    signal,
  });
}

/*指定した席マスタの詳細を取得する*/
export function fetchRestaurantMaster(id: number | string) {
  const encodedId = encodeURIComponent(String(id));

  return apiFetch<RestaurantMasterResponse>(
    `${RESTAURANT_MASTERS_API_API_PATH}/${encodedId}`,
    {
      method: "GET",
    },
  );
}

/*席マスタを登録する*/
export function createRestaurantMaster(payload: CreateRestaurantMasterRequest) {
  return apiFetch<RestaurantMasterResponse>(RESTAURANT_MASTERS_API_API_PATH, {
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
    `${RESTAURANT_MASTERS_API_API_PATH}/${encodedId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

// 指定時間帯に使用できない実テーブルIDを取得する。
export function fetchRestaurantMasterAvailabilities(
  params: RestaurantMasterAvailabilityParams,
  signal?: AbortSignal,
) {
  const searchParams = new URLSearchParams({
    starts_at: params.starts_at,
    ends_at: params.ends_at,
  });

  // 編集時は対象予約自身を重複判定から除外する。
  if (params.reservation_id !== undefined) {
    searchParams.set("reservation_id", String(params.reservation_id));
  }

  return apiFetch<RestaurantMasterAvailabilityResponse>(
    `${RESTAURANT_MASTER_AVAILABILITIES_PATH}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );
}
