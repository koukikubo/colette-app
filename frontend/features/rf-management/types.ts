import type { ApiSuccessResponse } from "@/lib/api/api-client";
import type { Pagination } from "@/lib/api/pagination";

// RFルールセットで使用できる状態。
// RailsのRfRuleSet::STATUSESに対応する。
export const RF_RULE_SET_STATUSES = ["draft", "published", "archived"] as const;

export type RfRuleSetStatus = (typeof RF_RULE_SET_STATUSES)[number];

// RF計算処理で使用できる状態。
// RailsのRfCalculationRun::STATUSESに対応する。
export const RF_CALCULATION_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type RfCalculationStatus = (typeof RF_CALCULATION_STATUSES)[number];

// RFルール作成者・計算実行者として返される担当者情報。
export type RfStaffSummary = {
  id: number;
  code: string | null;
  name: string | null;
};

// 基本コードマスタに登録されているRFランク。
// A・Bなどの内部コードと、Aランクなどの表示名を持つ。
export type RfRank = {
  id: number;
  code: string;
  label: string;
};

// Recency条件。最終来店日からの経過日数範囲を表す。
export type RfRecencyRule = {
  id: number;
  code: string;
  label: string;
  min_days: number;
  max_days: number | null;
  position: number;
};

// Frequency条件。集計期間内の来店回数範囲を表す。
export type RfFrequencyRule = {
  id: number;
  code: string;
  label: string;
  min_visits: number;
  max_visits: number | null;
  position: number;
};

// RecencyとFrequencyの組み合わせに割り当てられたRFランク。
export type RfRankMapping = {
  recency_rule_id: number;
  frequency_rule_id: number;
  rf_rank: RfRank;
};
// RFルールセットの詳細情報。
// GET /api/v1/rf_settingsのpublished_rule_setと
// GET /api/v1/rf_rule_sets/:idのrule_setに対応する。
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
// RFルールセット一覧で使用する概要情報。
// GET /api/v1/rf_rule_setsのrule_sets要素に対応する。
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
// RF計算結果に含まれるランクごとの顧客人数。
export type RfRankCount = RfRank & {
  count: number;
};
// 前回ランクから今回ランクへの変化と、その顧客人数。
export type RfRankTransition = {
  from_rf_rank: RfRank | null;
  to_rf_rank: RfRank | null;
  count: number;
};
// RF計算結果を適用する前に確認する変更件数の概要。
export type RfCalculationPreview = {
  changed_count: number;
  unchanged_count: number;
  excluded_count: number;
  rank_transitions: RfRankTransition[];
};
// RF計算結果の基本情報と集計結果。
// GET /api/v1/rf_settingsのcurrent_calculation_runに対応する。
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
// 計算履歴一覧の1行分。
// GET /api/v1/rf_calculation_runsのcalculation_runs要素に対応する。
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
// 計算履歴の詳細情報。
// GET /api/v1/rf_calculation_runs/:idのcalculation_runに対応する。
export type RfCalculationRunDetail = RfCalculationRun & {
  current: boolean;
  restorable: boolean;
};
// RF計算における顧客1人分の判定結果。
// GET /api/v1/rf_calculation_runs/:id/resultsのresults要素に対応する。
// rf_rankがnullの場合は、画面上ではNランク（未分類）として扱う。
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
// ページネーション対応APIへ渡す共通検索条件。
export type RfListParams = {
  page?: number;
  per_page?: number;
};
// GET /api/v1/rf_settingsのレスポンス。
export type RfSettingsResponse = ApiSuccessResponse<{
  published_rule_set: RfRuleSet | null;
  current_calculation_run: RfCalculationRun | null;
}>;
// GET /api/v1/rf_rule_setsのレスポンス。
export type RfRuleSetListResponse = ApiSuccessResponse<{
  rule_sets: RfRuleSetSummary[];
  pagination: Pagination;
}>;
// GET /api/v1/rf_rule_sets/:idのレスポンス。
export type RfRuleSetResponse = ApiSuccessResponse<{
  rule_set: RfRuleSet;
}>;
// GET /api/v1/rf_calculation_runsのレスポンス。
export type RfCalculationRunListResponse = ApiSuccessResponse<{
  calculation_runs: RfCalculationRunSummary[];
  pagination: Pagination;
}>;
// GET /api/v1/rf_calculation_runs/:idのレスポンス。
export type RfCalculationRunResponse = ApiSuccessResponse<{
  calculation_run: RfCalculationRunDetail;
}>;
// GET /api/v1/rf_calculation_runs/:id/resultsのレスポンス。
export type RfCustomerRankResultListResponse = ApiSuccessResponse<{
  results: RfCustomerRankResult[];
  pagination: Pagination;
}>;
