import { describe, expect, it } from "vitest";

import type { RfRuleSet } from "../../types";
import {
  buildCreateRfRuleSetInput,
  buildUpdateRfRuleSetInput,
} from "../../utils/rf-rule-set-input";

describe("RFルール入力変換", () => {
  it("基本設定から空の下書き作成データを作る", () => {
    expect(
      buildCreateRfRuleSetInput({
        name: "新しいRFルール",
        aggregation_months: 60,
        frequency_window_months: 12,
      }),
    ).toEqual({
      name: "新しいRFルール",
      aggregation_months: 60,
      frequency_window_months: 12,
      recency_rules: [],
      frequency_rules: [],
      rank_mappings: [],
    });
  });

  it("基本設定の更新時に条件と対応表を維持する", () => {
    const ruleSet: RfRuleSet = {
      id: 7,
      name: "更新前",
      version: 2,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: "draft",
      published_at: null,
      lock_version: 3,
      created_by_staff: null,
      created_at: "2026-09-30T00:00:00Z",
      updated_at: "2026-09-30T00:00:00Z",
      recency_rules: [
        {
          id: 11,
          code: "R1",
          label: "全期間",
          min_days: 0,
          max_days: null,
          position: 1,
        },
      ],
      frequency_rules: [
        {
          id: 21,
          code: "F1",
          label: "0回以上",
          min_visits: 0,
          max_visits: null,
          position: 1,
        },
      ],
      rank_mappings: [
        {
          recency_rule_id: 11,
          frequency_rule_id: 21,
          rf_rank: {
            id: 31,
            code: "A",
            label: "Aランク",
            display_color: "#059669",
          },
        },
      ],
    };

    expect(
      buildUpdateRfRuleSetInput(ruleSet, {
        name: "更新後",
        aggregation_months: 36,
        frequency_window_months: 6,
      }),
    ).toEqual({
      name: "更新後",
      aggregation_months: 36,
      frequency_window_months: 6,
      lock_version: 3,
      recency_rules: [
        {
          code: "R1",
          label: "全期間",
          min_days: 0,
          max_days: null,
          position: 1,
        },
      ],
      frequency_rules: [
        {
          code: "F1",
          label: "0回以上",
          min_visits: 0,
          max_visits: null,
          position: 1,
        },
      ],
      rank_mappings: [
        {
          recency_code: "R1",
          frequency_code: "F1",
          rf_rank_id: 31,
        },
      ],
    });
  });
});
