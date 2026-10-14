import type { ApiSuccessResponse } from "@/lib/api/api-client";

import type {
  RfFrequencyRule,
  RfRecencyRule,
} from "../../rf-management/types/rule-set";
import type { RfRank } from "../../rf-management/types/shared";

export type RfAnalysisCalculationRun = {
  id: number;
  base_date: string;
  rf_rule_set_id: number;
  rule_set: {
    id: number;
    name: string;
    version: number;
  };
};

export type RfAnalysisCell = {
  recency_rule_id: number;
  frequency_rule_id: number;
  rf_rank: RfRank;
  count: number;
  percentage: number;
};

export type RfAnalysisNoVisit = {
  count: number;
  percentage: number;
};

export type RfAnalysisRankDistribution = {
  rf_rank: RfRank;
  count: number;
  percentage: number;
};

export type RfAnalysisRankComparison = {
  rf_rank: RfRank;
  current_count: number;
  previous_count: number;
  count_delta: number;
  current_percentage: number;
  previous_percentage: number;
  percentage_point_delta: number;
};

export type RfAnalysisComparison = {
  calculation_run_id: number;
  base_date: string;
  ranks: RfAnalysisRankComparison[];
};

export type RfAnalysis = {
  calculation_run: RfAnalysisCalculationRun;
  eligible_count: number;
  excluded_count: number;
  unmatched_count: number;
  unmatched_percentage: number;
  no_visit: RfAnalysisNoVisit;
  recency_rules: RfRecencyRule[];
  frequency_rules: RfFrequencyRule[];
  rank_distribution: RfAnalysisRankDistribution[];
  cells: RfAnalysisCell[];
  comparison: RfAnalysisComparison | null;
};

export type RfAnalysisResponse = ApiSuccessResponse<{
  analysis: RfAnalysis | null;
}>;
