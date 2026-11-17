import { apiFetch, type ApiSuccessResponse } from "@/lib/api/api-client";
import type { DashboardAnalytics } from "../types";
export function fetchDashboardAnalytics() {
  return apiFetch<ApiSuccessResponse<DashboardAnalytics>>(
    "/api/v1/dashboard_analytics",
    { cache: "no-store" },
  );
}
