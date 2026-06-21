import { apiFetch } from "@/lib/api/api-client";

import type {
  ChangeCustomerVisibilityRequest,
  CreateCustomerRequest,
  CustomerListParams,
  CustomerListResponse,
  CustomerResponse,
  UpdateCustomerRequest,
} from "../types";

const CUSTOMERS_PATH = "/api/v1/customers";

/**
 * 顧客一覧APIのURLを生成する。
 */
function buildCustomersPath(params: CustomerListParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.visibility) {
    searchParams.set("visibility", params.visibility);
  }

  if (params.customer_kind) {
    searchParams.set("customer_kind", params.customer_kind);
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
 * 顧客一覧を取得する。
 */
export function fetchCustomers(params: CustomerListParams = {}) {
  return apiFetch<CustomerListResponse>(buildCustomersPath(params), {
    cache: "no-store",
  });
}

/**
 * 指定した顧客を取得する。
 */
export function fetchCustomer(id: number) {
  return apiFetch<CustomerResponse>(buildCustomerPath(id), {
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
