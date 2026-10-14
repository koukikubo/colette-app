import type { RfAnalysis } from "../types/analysis";

const rankA = {
  id: 1,
  code: "A",
  label: "Aランク",
  display_color: "#059669",
};

const rankB = {
  id: 2,
  code: "B",
  label: "Bランク",
  display_color: "#2563EB",
};

const rankN = {
  id: 3,
  code: "N",
  label: "Nランク",
  display_color: "#64748B",
};

const rankC = {
  id: 4,
  code: "C",
  label: "Cランク",
  display_color: "#D97706",
};

export const rfAnalysisFixture: RfAnalysis = {
  calculation_run: {
    id: 20,
    base_date: "2026-10-10",
    rf_rule_set_id: 5,
    rule_set: {
      id: 5,
      name: "標準RFルール",
      version: 3,
    },
  },
  eligible_count: 100,
  excluded_count: 8,
  unmatched_count: 0,
  unmatched_percentage: 0,
  no_visit: {
    count: 10,
    percentage: 10,
  },
  recency_rules: [
    {
      id: 11,
      code: "R1",
      label: "0〜90日",
      min_days: 0,
      max_days: 90,
      position: 1,
    },
    {
      id: 12,
      code: "R2",
      label: "91日以上",
      min_days: 91,
      max_days: null,
      position: 2,
    },
  ],
  frequency_rules: [
    {
      id: 21,
      code: "F1",
      label: "1回",
      min_visits: 1,
      max_visits: 1,
      position: 1,
    },
    {
      id: 22,
      code: "F2",
      label: "2回以上",
      min_visits: 2,
      max_visits: null,
      position: 2,
    },
  ],
  rank_distribution: [
    {
      rf_rank: rankA,
      count: 40,
      percentage: 40,
    },
    {
      rf_rank: rankB,
      count: 50,
      percentage: 50,
    },
    {
      rf_rank: rankN,
      count: 10,
      percentage: 10,
    },
    {
      rf_rank: rankC,
      count: 0,
      percentage: 0,
    },
  ],
  cells: [
    {
      recency_rule_id: 11,
      frequency_rule_id: 21,
      rf_rank: rankA,
      count: 15,
      percentage: 15,
    },
    {
      recency_rule_id: 11,
      frequency_rule_id: 22,
      rf_rank: rankA,
      count: 25,
      percentage: 25,
    },
    {
      recency_rule_id: 12,
      frequency_rule_id: 21,
      rf_rank: rankB,
      count: 30,
      percentage: 30,
    },
    {
      recency_rule_id: 12,
      frequency_rule_id: 22,
      rf_rank: rankB,
      count: 20,
      percentage: 20,
    },
  ],
  comparison: {
    calculation_run_id: 10,
    base_date: "2025-10-10",
    ranks: [
      {
        rf_rank: rankA,
        previous_count: 35,
        current_count: 40,
        count_delta: 5,
        previous_percentage: 35,
        current_percentage: 40,
        percentage_point_delta: 5,
      },
      {
        rf_rank: rankB,
        previous_count: 55,
        current_count: 50,
        count_delta: -5,
        previous_percentage: 55,
        current_percentage: 50,
        percentage_point_delta: -5,
      },
    ],
  },
};
