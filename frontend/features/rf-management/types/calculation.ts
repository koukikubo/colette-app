import type { ApiSuccessResponse } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";

import type { RfRank, RfStaffSummary } from "./shared";

// RailsのRfCalculationRun::STATUSESに対応する。
export const RF_CALCULATION_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type RfCalculationStatus = (typeof RF_CALCULATION_STATUSES)[number];

export type RfRankCount = RfRank & {
  count: number;
};

export type RfRankTransition = {
  from_rf_rank: RfRank | null;
  to_rf_rank: RfRank | null;
  count: number;
};

export type RfRankComparison = RfRank & {
  before_count: number;
  after_count: number;
  delta: number;
};

export type RfCalculationPreview = {
  changed_count: number;
  unchanged_count: number;
  excluded_count: number;
  rank_transitions: RfRankTransition[];
  rank_comparisons: RfRankComparison[];
};

export type RfCalculationRunInput = {
  rf_rule_set_id: number;
  base_date: string;
};

export type RfCalculationRun = {
  id: number;
  rf_rule_set_id: number;
  previous_run_id: number | null;
  base_date: string;
  aggregation_started_on: string;
  frequency_started_on: string;
  status: RfCalculationStatus;
  customer_count: number;
  excluded_count: number;
  unmatched_count: number;
  rank_counts: RfRankCount[];
  preview: RfCalculationPreview;
  started_at: string | null;
  completed_at: string | null;
  failure_message: string | null;
  started_by_staff: RfStaffSummary | null;
  created_at: string;
};

export type RfCalculationRunSummary = {
  id: number;
  previous_run_id: number | null;
  rule_set: {
    id: number;
    name: string;
    version: number;
  };
  base_date: string;
  aggregation_started_on: string;
  frequency_started_on: string;
  status: RfCalculationStatus;
  customer_count: number;
  excluded_count: number;
  unmatched_count: number;
  started_by_staff: RfStaffSummary | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  current: boolean;
  restorable: boolean;
};

export type RfCalculationRunDetail = RfCalculationRun & {
  current: boolean;
  restorable: boolean;
};

export type RfCustomerRankResult = {
  id: number;
  customer: {
    id: number;
    name: string;
  };
  previous_rf_rank: RfRank | null;
  rf_rank: RfRank | null;
  changed: boolean;
  recency_days: number | null;
  frequency_count: number | null;
  last_visit_on: string | null;
  previous_exclusion_reason: string | null;
  exclusion_reason: string | null;
};

export type RfCalculationRunListResponse = ApiSuccessResponse<{
  calculation_runs: RfCalculationRunSummary[];
  pagination: Pagination;
}>;

export type RfCalculationRunResponse = ApiSuccessResponse<{
  calculation_run: RfCalculationRunDetail;
}>;

export type RfCalculationRunCreateResponse = ApiSuccessResponse<{
  calculation_run: RfCalculationRun;
}>;

export type RfCalculationRunActivationResponse = ApiSuccessResponse<{
  calculation_run: RfCalculationRun;
  current_calculation_run_id: number;
}>;

export type RfCalculationRunRestoreResponse =
  RfCalculationRunActivationResponse;

export type RfCustomerRankResultListResponse = ApiSuccessResponse<{
  results: RfCustomerRankResult[];
  pagination: Pagination;
}>;
