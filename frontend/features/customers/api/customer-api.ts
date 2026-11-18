import { apiFetch, ApiClientError } from "@/lib/api/api-client";

import type {
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
export function createCustomer(payload: CreateCustomerRequest, key: string) {
  return apiFetch<CustomerResponse>(CUSTOMERS_PATH, {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: payload,
  }).then(validateCustomerCreation);
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

export function fetchCustomerCreationResult(key: string) {
  return apiFetch<CustomerResponse>(`${CUSTOMERS_PATH}/creation_result`, {
    headers: { "Idempotency-Key": key },
    cache: "no-store",
  }).then(validateCustomerCreation);
}

// HTTP成功だけで登録を確定せず、結果を識別できるIDまで確認する。
function validateCustomerCreation(response: CustomerResponse) {
  const id = response.data?.customer?.id;
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new ApiClientError(
      "登録結果の応答が不正です。結果を再確認してください",
      502,
      [],
      "invalid_response",
    );
  return response;
}
