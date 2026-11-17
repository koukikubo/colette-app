import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import { useRfRuleSetDetail } from "../../hooks/useRfRuleSetDetail";

const mocks = vi.hoisted(() => ({
  fetchRfRuleSet: vi.fn(),
}));

vi.mock("../../api/rf-management-api", () => ({
  fetchRfRuleSet: mocks.fetchRfRuleSet,
}));

const ruleSet = {
  id: 7,
  name: "下書きRFルール",
  version: 2,
  aggregation_months: 60,
  frequency_window_months: 12,
  status: "draft",
  published_at: null,
  lock_version: 3,
  created_by_staff: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  recency_rules: [],
  frequency_rules: [],
  rank_mappings: [],
};

describe("useRfRuleSetDetail", () => {
  beforeEach(() => {
    mocks.fetchRfRuleSet.mockReset();
  });

  it("IDがない場合はAPIを呼び出さない", () => {
    const { result } = renderHook(() =>
      useRfRuleSetDetail({
        ruleSetId: null,
      }),
    );

    expect(mocks.fetchRfRuleSet).not.toHaveBeenCalled();
    expect(result.current.ruleSet).toBeNull();
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("指定したRFルールの詳細を取得する", async () => {
    mocks.fetchRfRuleSet.mockResolvedValue({
      data: {
        rule_set: ruleSet,
      },
    });

    const { result } = renderHook(() =>
      useRfRuleSetDetail({
        ruleSetId: 7,
      }),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mocks.fetchRfRuleSet).toHaveBeenCalledWith(
      7,
      expect.any(AbortSignal),
    );

    expect(result.current.ruleSet).toEqual(ruleSet);
    expect(result.current.errorMessage).toBeNull();
  });

  it("取得に失敗した場合はエラーメッセージを返す", async () => {
    mocks.fetchRfRuleSet.mockRejectedValue(
      new ApiClientError("RFルールが見つかりません。", 404),
    );

    const { result } = renderHook(() =>
      useRfRuleSetDetail({
        ruleSetId: 999,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.ruleSet).toBeNull();
    expect(result.current.errorMessage).toBe("RFルールが見つかりません。");
  });

  it("reloadKeyが変わると詳細を再取得する", async () => {
    mocks.fetchRfRuleSet.mockResolvedValue({
      data: {
        rule_set: ruleSet,
      },
    });

    const { result, rerender } = renderHook(
      ({ reloadKey }) =>
        useRfRuleSetDetail({
          ruleSetId: 7,
          reloadKey,
        }),
      {
        initialProps: {
          reloadKey: 0,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mocks.fetchRfRuleSet).toHaveBeenCalledTimes(1);

    rerender({
      reloadKey: 1,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(mocks.fetchRfRuleSet).toHaveBeenCalledTimes(2);
    });
  });
});
