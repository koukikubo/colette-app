import { apiFetch } from "@/lib/api/api-client";
import type { RfMonthComparisonResponse } from "../types/customer-transition";

const BASE_PATH = "/api/v1/rf_customer_transitions";

export function fetchRfMonthComparison(
  startMonth: string,
  endMonth: string,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    start_month: startMonth,
    end_month: endMonth,
  });
  return apiFetch<RfMonthComparisonResponse>(`${BASE_PATH}/compare?${params}`, {
    cache: "no-store",
    signal,
  });
}
