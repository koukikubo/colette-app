import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRfSettings } from "../../hooks/useRfSettings";

const mocks = vi.hoisted(() => ({
  fetchRfSettings: vi.fn(),
}));

vi.mock("../../api/rf-management-api", () => ({
  fetchRfSettings: mocks.fetchRfSettings,
}));

describe("useRfSettings", () => {
  beforeEach(() => {
    mocks.fetchRfSettings.mockReset();
  });

  it("現在のRF設定を取得する", async () => {
    const settings = {
      published_rule_set: null,
      current_calculation_run: null,
    };

    mocks.fetchRfSettings.mockResolvedValue({
      data: settings,
    });

    const { result } = renderHook(() => useRfSettings());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual(settings);
    expect(result.current.errorMessage).toBeNull();
  });

  it("取得に失敗した場合はエラーメッセージを返す", async () => {
    mocks.fetchRfSettings.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useRfSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toBeNull();
    expect(result.current.errorMessage).toBe("RF設定を取得できませんでした。");
  });
});
