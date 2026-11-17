import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRfCalculationRunDetail } from "../../hooks/useRfCalculationRunDetail";

const mocks = vi.hoisted(() => ({
  fetchRfCalculationRun: vi.fn(),
}));

vi.mock("../../api/rf-management-api", () => ({
  fetchRfCalculationRun: mocks.fetchRfCalculationRun,
}));

describe("useRfCalculationRunDetail", () => {
  beforeEach(() => {
    mocks.fetchRfCalculationRun.mockReset();
  });

  it("IDがない場合はAPIを呼び出さない", () => {
    const { result } = renderHook(() => useRfCalculationRunDetail(null));

    expect(mocks.fetchRfCalculationRun).not.toHaveBeenCalled();
    expect(result.current.calculationRun).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("指定した計算履歴の詳細を取得する", async () => {
    const calculationRun = {
      id: 20,
      base_date: "2026-09-29",
      status: "completed",
      customer_count: 120,
      excluded_count: 8,
      unmatched_count: 2,
      current: true,
      restorable: false,
    };

    mocks.fetchRfCalculationRun.mockResolvedValue({
      data: {
        calculation_run: calculationRun,
      },
    });

    const { result } = renderHook(() => useRfCalculationRunDetail(20));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mocks.fetchRfCalculationRun).toHaveBeenCalledWith(
      20,
      expect.any(AbortSignal),
    );
    expect(result.current.calculationRun).toEqual(calculationRun);
    expect(result.current.errorMessage).toBeNull();
  });

  it("取得に失敗した場合はエラーメッセージを返す", async () => {
    mocks.fetchRfCalculationRun.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useRfCalculationRunDetail(20));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.calculationRun).toBeNull();
    expect(result.current.errorMessage).toBe(
      "RF計算履歴の詳細を取得できませんでした。",
    );
  });
});
