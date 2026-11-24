import { apiFetch } from "@/lib/api/api-client";

import type {
  CustomerAnalyticsData,
  ApiSuccessResponse,
  ChangeCustomerVisibilityRequest,
  CreateCustomerRequest,
  CustomerDetailResponse,
  CustomerListParams,
  CustomerListResponse,
  CustomerReservationListParams,
  CustomerReservationListResponse,
  CustomerResponse,
  UpdateCustomerRequest,
} from "../types";

const CUSTOMERS_PATH = "/api/v1/customers";

/**
 * 顧客一覧APIのURLを生成する。
 */
function buildCustomersPath(params: CustomerListParams = {}) {
  const searchParams = new URLSearchParams();

  // RF条件も一覧と同じリクエストへ渡し、サーバー側でページ分割前に絞り込む。
  if (params.rf_rank_id !== undefined)
    searchParams.set("rf_rank_id", String(params.rf_rank_id));
  if (params.rf_rank_state)
    searchParams.set("rf_rank_state", params.rf_rank_state);

  if (params.customer_rank_id !== undefined) {
    searchParams.set("customer_rank_id", String(params.customer_rank_id));
  }

  if (params.visibility) {
    searchParams.set("visibility", params.visibility);
  }

  if (params.customer_kind) {
    searchParams.set("customer_kind", params.customer_kind);
  }

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.per_page !== undefined) {
    searchParams.set("per_page", String(params.per_page));
  }

  // 0回も有効な条件。未指定だけを省き、日付・回数はサーバーでも検証する。
  for (const key of [
    "last_visit_from",
    "last_visit_to",
    "min_visits",
    "max_visits",
  ] as const) {
    if (params[key] !== undefined) searchParams.set(key, String(params[key]));
  }
  const query = params.query?.trim();

  if (query) {
    searchParams.set("query", query);
  }

  const queryString = searchParams.toString();

  return queryString ? `${CUSTOMERS_PATH}?${queryString}` : CUSTOMERS_PATH;
}

/**
 * 顧客IDを含むAPIパスを生成する。
 */
function buildCustomerPath(id: number) {
  return `${CUSTOMERS_PATH}/${encodeURIComponent(String(id))}`;
}

/**
 * 顧客予約履歴APIのURLを生成する。
 */
function buildCustomerReservationsPath(
  customerId: number,
  params: CustomerReservationListParams = {},
) {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.per_page !== undefined) {
    searchParams.set("per_page", String(params.per_page));
  }

  const path = `${buildCustomerPath(customerId)}/reservations`;
  const queryString = searchParams.toString();

  return queryString ? `${path}?${queryString}` : path;
}

/**
 * 顧客一覧を取得する。
 */
export function fetchCustomers(params: CustomerListParams = {}) {
  return apiFetch<CustomerListResponse>(buildCustomersPath(params), {
    cache: "no-store",
  });
}

/**
 * 指定した顧客の予約履歴を取得する。
 */
export function fetchCustomerReservations(
  customerId: number,
  params: CustomerReservationListParams = {},
) {
  return apiFetch<CustomerReservationListResponse>(
    buildCustomerReservationsPath(customerId, params),
    {
      cache: "no-store",
    },
  );
}

/**
 * 指定した顧客を取得する。
 */
export function fetchCustomer(id: number) {
  return apiFetch<CustomerDetailResponse>(buildCustomerPath(id), {
    cache: "no-store",
  });
}

/**
 * 顧客を登録する。
 */
export function createCustomer(payload: CreateCustomerRequest) {
  return apiFetch<CustomerResponse>(CUSTOMERS_PATH, {
    method: "POST",
    body: payload,
  });
}

/**
 * 顧客情報を更新する。
 */
export function updateCustomer(id: number, payload: UpdateCustomerRequest) {
  return apiFetch<CustomerResponse>(buildCustomerPath(id), {
    method: "PATCH",
    body: payload,
  });
}

/**
 * 顧客を非表示にする。
 */
export function hideCustomer(
  id: number,
  payload: ChangeCustomerVisibilityRequest,
) {
  return apiFetch<CustomerResponse>(`${buildCustomerPath(id)}/hidden`, {
    method: "PATCH",
    body: payload,
  });
}

/**
 * 非表示の顧客を復帰する。
 */
export function restoreCustomer(
  id: number,
  payload: ChangeCustomerVisibilityRequest,
) {
  return apiFetch<CustomerResponse>(`${buildCustomerPath(id)}/restore`, {
    method: "PATCH",
    body: payload,
  });
}

// 初期画面用の集計。顧客の明細一覧は取得しない。
export function fetchCustomerAnalytics(signal?: AbortSignal) {
  return apiFetch<ApiSuccessResponse<CustomerAnalyticsData>>(
    "/api/v1/customer_analytics",
    { signal },
  );
}
