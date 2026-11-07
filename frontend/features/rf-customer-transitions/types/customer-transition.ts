import type { ApiSuccessResponse } from "@/lib/api/api-client";
import type { RfRank } from "@/features/rf-management/types/shared";

export type RfTransitionRank = RfRank & {
  position: number;
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
  comparison_run_id: number;
  counts: Record<RfMovementCategory, number>;
  transitions: RfCustomerTransition[];
};

export type RfMonthComparison = {
  start_month: string;
  end_month: string;
  provisional: boolean;
  start_run: { id: number; base_date: string; rule_set_id: number };
  end_run: { id: number; base_date: string; rule_set_id: number };
  movement: RfCustomerMovementSummary;
};
export type RfMonthComparisonResponse = ApiSuccessResponse<RfMonthComparison>;
