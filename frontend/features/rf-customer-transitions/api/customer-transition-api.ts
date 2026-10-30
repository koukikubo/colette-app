import { apiFetch } from "@/lib/api/api-client";

import type {
  RfCustomerMovementResponse,
  RfCustomerTransitionTableResponse,
} from "../types/customer-transition";

const BASE_PATH = "/api/v1/rf_customer_transitions";

export function fetchRfCustomerTransitionTable(signal?: AbortSignal) {
  return apiFetch<RfCustomerTransitionTableResponse>(BASE_PATH, {
    cache: "no-store",
    signal,
  });
}

export function fetchRfCustomerMovements(
  calculationRunId: number,
  signal?: AbortSignal,
) {
  const id = encodeURIComponent(String(calculationRunId));

  return apiFetch<RfCustomerMovementResponse>(`${BASE_PATH}/${id}/movements`, {
    cache: "no-store",
    signal,
  });
}

export function fetchRfMonthComparison(
  startMonth: string,
  endMonth: string,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    start_month: startMonth,
    end_month: endMonth,
  });
  return apiFetch<
    import("../types/customer-transition").RfMonthComparisonResponse
  >(`${BASE_PATH}/compare?${params}`, {
    cache: "no-store",
    signal,
  });
}
