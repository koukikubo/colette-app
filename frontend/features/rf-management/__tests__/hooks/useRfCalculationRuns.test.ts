import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRfCalculationRuns } from "../../hooks/useRfCalculationRuns";

const mocks = vi.hoisted(() => ({
  fetchRfCalculationRuns: vi.fn(),
}));

vi.mock("../../api/rf-management-api", () => ({
  fetchRfCalculationRuns: mocks.fetchRfCalculationRuns,
}));

describe("useRfCalculationRuns", () => {
  beforeEach(() => {
    mocks.fetchRfCalculationRuns.mockReset();
  });

  it("指定ページのRF計算履歴を取得する", async () => {
    const calculationRuns = [
      {
        id: 20,
        base_date: "2026-09-29",
        status: "completed",
      },
    ];

    const pagination = {
      current_page: 2,
      per_page: 10,
      total_pages: 3,
      total_count: 25,
    };

    mocks.fetchRfCalculationRuns.mockResolvedValue({
      data: {
        calculation_runs: calculationRuns,
        pagination,
      },
    });

    const { result } = renderHook(() =>
      useRfCalculationRuns({
        page: 2,
        perPage: 10,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mocks.fetchRfCalculationRuns).toHaveBeenCalledWith(
      {
        page: 2,
        per_page: 10,
      },
      expect.any(AbortSignal),
    );

    expect(result.current.calculationRuns).toEqual(calculationRuns);
    expect(result.current.pagination).toEqual(pagination);
    expect(result.current.errorMessage).toBeNull();
  });

  it("取得に失敗した場合はエラーメッセージを返す", async () => {
    mocks.fetchRfCalculationRuns.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() =>
      useRfCalculationRuns({
        page: 1,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.calculationRuns).toEqual([]);
    expect(result.current.pagination).toBeNull();
    expect(result.current.errorMessage).toBe(
      "RF計算履歴を取得できませんでした。",
    );
  });
});
