import type { ApiSuccessResponse } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";

import type { RfListParams, RfRank, RfStaffSummary } from "./shared";

// RailsのRfRuleSet::STATUSESに対応する。
export const RF_RULE_SET_STATUSES = ["draft", "published", "archived"] as const;

export type RfRuleSetStatus = (typeof RF_RULE_SET_STATUSES)[number];

export type RfRecencyRule = {
  id: number;
  code: string;
  label: string;
  min_days: number;
  max_days: number | null;
  position: number;
};

export type RfFrequencyRule = {
  id: number;
  code: string;
  label: string;
  min_visits: number;
  max_visits: number | null;
  position: number;
};

export type RfRankMapping = {
  recency_rule_id: number;
  frequency_rule_id: number;
  rf_rank: RfRank;
};

export type RfRuleSet = {
  id: number;
  name: string;
  version: number;
  aggregation_months: number;
  frequency_window_months: number;
  status: RfRuleSetStatus;
  published_at: string | null;
  recency_rules: RfRecencyRule[];
  frequency_rules: RfFrequencyRule[];
  rank_mappings: RfRankMapping[];
  lock_version: number;
  created_by_staff: RfStaffSummary | null;
  created_at: string;
  updated_at: string;
};

export type RfRuleSetSummary = {
  id: number;
  name: string;
  version: number;
  aggregation_months: number;
  frequency_window_months: number;
  status: RfRuleSetStatus;
  published_at: string | null;
  created_by_staff: RfStaffSummary | null;
  created_at: string;
  updated_at: string;
};

export type RfRuleSetListParams = RfListParams & {
  status?: RfRuleSetStatus;
};

export type RfRecencyRuleInput = Omit<RfRecencyRule, "id">;
export type RfFrequencyRuleInput = Omit<RfFrequencyRule, "id">;

export type RfRankMappingInput = {
  recency_code: string;
  frequency_code: string;
  rf_rank_id: number;
};

export type RfRuleSetInput = {
  name: string;
  aggregation_months: number;
  frequency_window_months: number;
  recency_rules: RfRecencyRuleInput[];
  frequency_rules: RfFrequencyRuleInput[];
  rank_mappings: RfRankMappingInput[];
};

export type RfRuleSetUpdateInput = RfRuleSetInput & {
  lock_version: number;
};

export type RfRuleSetValidationIssue = {
  code: string;
  message: string;
};

export type RfRuleSetValidation = {
  valid: boolean;
  errors: RfRuleSetValidationIssue[];
  warnings: RfRuleSetValidationIssue[];
};

export type RfRuleSetListResponse = ApiSuccessResponse<{
  rule_sets: RfRuleSetSummary[];
  pagination: Pagination;
}>;

export type RfRuleSetResponse = ApiSuccessResponse<{
  rule_set: RfRuleSet;
}>;

export type RfRuleSetValidationResponse = ApiSuccessResponse<{
  validation: RfRuleSetValidation;
}>;
