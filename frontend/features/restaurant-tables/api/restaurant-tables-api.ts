import { apiFetch } from "@/lib/api/api-client";

import type {
  CreateRestaurantTableRequest,
  RestaurantTableResponse,
  RestaurantTablesResponse,
  UpdateRestaurantTableRequest,
} from "../types";

const RESTAURANT_TABLES_API_PATH = "/api/v1/restaurant_tables";

/*席マスタ一覧を取得する*/
export function fetchRestaurantTables() {
  return apiFetch<RestaurantTablesResponse>(RESTAURANT_TABLES_API_PATH, {
    method: "GET",
  });
}

/*指定した席マスタの詳細を取得する*/
export function fetchRestaurantTable(id: number | string) {
  const encodedId = encodeURIComponent(String(id));

  return apiFetch<RestaurantTableResponse>(
    `${RESTAURANT_TABLES_API_PATH}/${encodedId}`,
    {
      method: "GET",
    },
  );
}

/*席マスタを登録する*/
export function createRestaurantTable(payload: CreateRestaurantTableRequest) {
  return apiFetch<RestaurantTableResponse>(RESTAURANT_TABLES_API_PATH, {
    method: "POST",
    body: payload,
  });
}

/*席マスタを更新する*/
export function updateRestaurantTable(
  id: number | string,
  payload: UpdateRestaurantTableRequest,
) {
  const encodedId = encodeURIComponent(String(id));

  return apiFetch<RestaurantTableResponse>(
    `${RESTAURANT_TABLES_API_PATH}/${encodedId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}
