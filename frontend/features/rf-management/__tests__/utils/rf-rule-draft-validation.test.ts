import { describe, expect, it } from "vitest";

import {
  validateFrequencyRules,
  validateRankMappings,
  validateRecencyRules,
} from "../../utils/rf-rule-draft-validation";

describe("RFルールの入力中検証", () => {
  it("最終来店日からの期間の空白を具体的に案内する", () => {
    const issues = validateRecencyRules([
      {
        code: "R1",
        label: "90日以内",
        min_days: 0,
        max_days: 90,
        position: 1,
      },
      {
        code: "R2",
        label: "100日以上",
        min_days: 100,
        max_days: null,
        position: 2,
      },
    ]);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            "「90日以内」と「100日以上」の間で、91日から99日までが未設定です。",
        }),
      ]),
    );
  });

  it("来店回数の重複を具体的に案内する", () => {
    const issues = validateFrequencyRules([
      {
        code: "F1",
        label: "0〜2回",
        min_visits: 0,
        max_visits: 2,
        position: 1,
      },
      {
        code: "F2",
        label: "2回以上",
        min_visits: 2,
        max_visits: null,
        position: 2,
      },
    ]);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            "「0〜2回」と「2回以上」で、2回から2回までが重複しています。",
        }),
      ]),
    );
  });

  it("RFランクが未設定の組み合わせを名称で案内する", () => {
    const issues = validateRankMappings(
      [
        {
          code: "R1",
          label: "90日以内",
          min_days: 0,
          max_days: null,
          position: 1,
        },
      ],
      [
        {
          code: "F1",
          label: "3回以上",
          min_visits: 0,
          max_visits: null,
          position: 1,
        },
      ],
      [],
    );

    expect(issues).toEqual([
      expect.objectContaining({
        message: "「90日以内 × 3回以上」のRFランクを選択してください。",
      }),
    ]);
  });
});
