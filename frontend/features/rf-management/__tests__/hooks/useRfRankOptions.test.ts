import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRfRankOptions } from "../../hooks/useRfRankOptions";

const mocks = vi.hoisted(() => ({
  fetchStandardCodes: vi.fn(),
}));

vi.mock("@/features/standard-codes/api/standard-code-api", () => ({
  fetchStandardCodes: mocks.fetchStandardCodes,
}));

describe("useRfRankOptions", () => {
  beforeEach(() => {
    mocks.fetchStandardCodes.mockReset();
  });

  it("有効なRFランクを表示順に返す", async () => {
    mocks.fetchStandardCodes.mockResolvedValue({
      data: {
        standard_masters: [
          {
            id: 7,
            system_key: "rf_rank",
            display_code: "00007",
            name: "RFランク",
            description: null,
            position: 7,
            active: true,
            items: [
              {
                id: 32,
                display_code: "00032",
                label: "Bランク",
                description: null,
                position: 2,
                active: true,
              },
              {
                id: 31,
                display_code: "00031",
                label: "Aランク",
                description: null,
                position: 1,
                active: true,
              },
              {
                id: 33,
                display_code: "00033",
                label: "無効なランク",
                description: null,
                position: 3,
                active: false,
              },
            ],
          },
        ],
      },
    });

    const { result } = renderHook(() => useRfRankOptions());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      {
        id: 31,
        label: "Aランク",
      },
      {
        id: 32,
        label: "Bランク",
      },
    ]);

    expect(result.current.errorMessage).toBeNull();
  });

  it("RFランクの取得に失敗した場合はエラーを返す", async () => {
    mocks.fetchStandardCodes.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useRfRankOptions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.errorMessage).toBe(
      "RFランクの選択肢を取得できませんでした。",
    );
  });
});
