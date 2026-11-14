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

export type RfComparisonPeriod = {
  month: string;
  base_date: string;
  run_id: number;
  rule_set_id: number;
};
export function fetchRfComparisonPeriods(signal?: AbortSignal) {
  return apiFetch<{
    status: "success";
    data: { periods: RfComparisonPeriod[] };
  }>(`${BASE_PATH}/periods`, { cache: "no-store", signal });
}
