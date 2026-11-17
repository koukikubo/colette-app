import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch, ApiClientError } from "@/lib/api/api-client";

import {
  archiveRfRuleSet,
  createRfRuleSet,
  deleteRfRuleSet,
  publishRfRuleSet,
  updateRfRuleSet,
  validateRfRuleSet,
} from "../../api/rf-management-api";
import type { RfRuleSetInput } from "../../types";

vi.mock("@/lib/api/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/api-client")>();

  return {
    ...actual,
    apiFetch: vi.fn(),
  };
});

const mockedApiFetch = vi.mocked(apiFetch);

const input: RfRuleSetInput = {
  name: "テスト用RFルール",
  aggregation_months: 12,
  frequency_window_months: 6,
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
      label: "全回数",
      min_visits: 0,
      max_visits: null,
      position: 1,
    },
  ],
  rank_mappings: [
    {
      recency_code: "R1",
      frequency_code: "F1",
      rf_rank_id: 10,
    },
  ],
};

describe("RFルール更新系API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("作成時に条件と対応表をrf_rule_setで包んで送る", async () => {
    await createRfRuleSet(input);

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/rf_rule_sets", {
      method: "POST",
      body: { rf_rule_set: input },
    });
  });

  it("更新時にlock_versionが0でも省略せず全体を送る", async () => {
    const updateInput = { ...input, lock_version: 0 };

    await updateRfRuleSet(7, updateInput);

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/rf_rule_sets/7", {
      method: "PATCH",
      body: { rf_rule_set: updateInput },
    });
  });

  it("検証NGを通信エラーにせず、検証結果として返す", async () => {
    const result = {
      data: {
        validation: {
          valid: false,
          errors: [
            {
              code: "mapping_missing",
              message: "未設定の組み合わせがあります",
            },
          ],
          warnings: [],
        },
      },
    };
    mockedApiFetch.mockResolvedValueOnce(result);

    await expect(validateRfRuleSet(7)).resolves.toEqual(result);
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/v1/rf_rule_sets/7/validate",
      { method: "POST" },
    );
  });

  it.each([
    ["publish", publishRfRuleSet],
    ["archive", archiveRfRuleSet],
  ] as const)("%sにlock_versionを送る", async (action, execute) => {
    await execute(7, 3);

    expect(mockedApiFetch).toHaveBeenCalledWith(
      `/api/v1/rf_rule_sets/7/${action}`,
      {
        method: "PATCH",
        body: { rf_rule_set: { lock_version: 3 } },
      },
    );
  });

  it("削除時にlock_versionを送り、本文なしで完了する", async () => {
    mockedApiFetch.mockResolvedValueOnce(null);

    await expect(deleteRfRuleSet(7, 3)).resolves.toBeUndefined();

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/rf_rule_sets/7", {
      method: "DELETE",
      body: { rf_rule_set: { lock_version: 3 } },
    });
  });

  it.each([403, 409, 422])("%sエラーを画面側にそのまま渡す", async (status) => {
    const error = new ApiClientError("処理できません", status);
    mockedApiFetch.mockRejectedValueOnce(error);

    await expect(
      updateRfRuleSet(7, { ...input, lock_version: 0 }),
    ).rejects.toBe(error);
  });
});
