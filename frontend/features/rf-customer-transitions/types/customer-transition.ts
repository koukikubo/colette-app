import type { ApiSuccessResponse } from "@/lib/api/api-client";
import type { RfRank } from "@/features/rf-management/types/shared";

export type RfTransitionRank = RfRank & {
  position: number;
};

export type RfTransitionRankPopulation = RfTransitionRank & {
  count: number;
};

export type RfCustomerTransitionRow = {
  calculation_run_id: number;
  previous_run_id: number | null;
  base_date: string;
  rank_counts: Record<string, number>;
  ranks: RfTransitionRankPopulation[];
  ranked_count: number;
  unmatched_count: number;
  excluded_count: number;
  eligible_count: number;
  total_count: number;
};

export type RfCustomerTransitionTable = {
  current_calculation_run_id: number | null;
  rows: RfCustomerTransitionRow[];
};

export type RfMovementCategory =
  | "added"
  | "removed"
  | "excluded"
  | "unmatched"
  | "no_visit"
  | "up"
  | "down"
  | "unchanged"
  | "same_position";

export type RfMovementState =
  "missing" | "excluded" | "unmatched" | "no_visit" | "ranked";

export type RfCustomerTransition = {
  category: RfMovementCategory;
  from_state: RfMovementState;
  from_rank: RfTransitionRank | null;
  to_state: RfMovementState;
  to_rank: RfTransitionRank | null;
  count: number;
};

export type RfCustomerMovementSummary = {
  comparison_run_id: number | null;
  counts: Record<RfMovementCategory, number> | null;
  transitions: RfCustomerTransition[];
};

export type RfCustomerTransitionTableResponse = ApiSuccessResponse<{
  table: RfCustomerTransitionTable;
}>;

export type RfCustomerMovementResponse = ApiSuccessResponse<{
  calculation_run_id: number;
  movement: RfCustomerMovementSummary;
}>;

export type RfMonthComparison = {
  start_month: string;
  end_month: string;
  provisional: boolean;
  start_run: { id: number; base_date: string; rule_set_id: number };
  end_run: { id: number; base_date: string; rule_set_id: number };
  movement: RfCustomerMovementSummary;
};
export type RfMonthComparisonResponse = ApiSuccessResponse<RfMonthComparison>;
