import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import { useRfRuleSets } from "../../hooks/useRfRuleSets";

const mocks = vi.hoisted(() => ({
  fetchRfRuleSets: vi.fn(),
}));

vi.mock("../../api/rf-management-api", () => ({
  fetchRfRuleSets: mocks.fetchRfRuleSets,
}));

describe("useRfRuleSets", () => {
  beforeEach(() => {
    mocks.fetchRfRuleSets.mockReset();
  });

  it("指定ページのRFルール一覧を取得する", async () => {
    const ruleSets = [
      {
        id: 3,
        name: "新しいRFルール",
        version: 3,
        aggregation_months: 60,
        frequency_window_months: 12,
        status: "draft",
        published_at: null,
        created_by_staff: null,
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-01T00:00:00Z",
      },
    ];

    const pagination = {
      current_page: 2,
      per_page: 10,
      total_pages: 3,
      total_count: 21,
    };

    mocks.fetchRfRuleSets.mockResolvedValue({
      data: {
        rule_sets: ruleSets,
        pagination,
      },
    });

    const { result } = renderHook(() =>
      useRfRuleSets({
        page: 2,
        perPage: 10,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mocks.fetchRfRuleSets).toHaveBeenCalledWith(
      {
        page: 2,
        per_page: 10,
      },
      expect.any(AbortSignal),
    );

    expect(result.current.ruleSets).toEqual(ruleSets);
    expect(result.current.pagination).toEqual(pagination);
    expect(result.current.errorMessage).toBeNull();
  });

  it("reloadKeyが変わると一覧を再取得する", async () => {
    mocks.fetchRfRuleSets.mockResolvedValue({
      data: {
        rule_sets: [],
        pagination: {
          current_page: 1,
          per_page: 10,
          total_pages: 0,
          total_count: 0,
        },
      },
    });

    const { result, rerender } = renderHook(
      ({ reloadKey }) =>
        useRfRuleSets({
          page: 1,
          perPage: 10,
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

    expect(mocks.fetchRfRuleSets).toHaveBeenCalledTimes(1);

    rerender({
      reloadKey: 1,
    });

    await waitFor(() => {
      expect(mocks.fetchRfRuleSets).toHaveBeenCalledTimes(2);
    });
  });

  it("取得に失敗した場合はエラーメッセージを返す", async () => {
    mocks.fetchRfRuleSets.mockRejectedValue(
      new ApiClientError("RFルール一覧の取得に失敗しました。", 500),
    );

    const { result } = renderHook(() => useRfRuleSets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.ruleSets).toEqual([]);
    expect(result.current.pagination).toBeNull();
    expect(result.current.errorMessage).toBe(
      "RFルール一覧の取得に失敗しました。",
    );
  });
});
