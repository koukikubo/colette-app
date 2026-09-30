import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRfCalculationResults } from "../../hooks/useRfCalculationResults";

const mocks = vi.hoisted(() => ({
  fetchRfCalculationResults: vi.fn(),
}));

vi.mock("../../api/rf-management-api", () => ({
  fetchRfCalculationResults: mocks.fetchRfCalculationResults,
}));

describe("useRfCalculationResults", () => {
  beforeEach(() => {
    mocks.fetchRfCalculationResults.mockReset();
  });

  it("計算履歴IDがない場合はAPIを呼び出さない", () => {
    const { result } = renderHook(() =>
      useRfCalculationResults({
        calculationRunId: null,
      }),
    );

    expect(mocks.fetchRfCalculationResults).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("指定した計算履歴の顧客別結果を取得する", async () => {
    const results = [
      {
        id: 100,
        customer: {
          id: 30,
          name: "山田 太郎",
        },
        previous_rf_rank: {
          id: 1,
          code: "B",
          label: "Bランク",
        },
        rf_rank: {
          id: 2,
          code: "A",
          label: "Aランク",
        },
        changed: true,
        recency_days: 30,
        frequency_count: 5,
        last_visit_on: "2026-08-30",
        exclusion_reason: null,
      },
    ];

    const pagination = {
      current_page: 2,
      per_page: 20,
      total_pages: 3,
      total_count: 45,
    };

    mocks.fetchRfCalculationResults.mockResolvedValue({
      data: {
        results,
        pagination,
      },
    });

    const { result } = renderHook(() =>
      useRfCalculationResults({
        calculationRunId: 20,
        page: 2,
        perPage: 20,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mocks.fetchRfCalculationResults).toHaveBeenCalledWith(
      20,
      {
        page: 2,
        per_page: 20,
      },
      expect.any(AbortSignal),
    );

    expect(result.current.results).toEqual(results);
    expect(result.current.pagination).toEqual(pagination);
    expect(result.current.errorMessage).toBeNull();
  });

  it("取得に失敗した場合はエラーメッセージを返す", async () => {
    mocks.fetchRfCalculationResults.mockRejectedValue(
      new Error("network error"),
    );

    const { result } = renderHook(() =>
      useRfCalculationResults({
        calculationRunId: 20,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.pagination).toBeNull();
    expect(result.current.errorMessage).toBe(
      "顧客別RF計算結果を取得できませんでした。",
    );
  });
});
