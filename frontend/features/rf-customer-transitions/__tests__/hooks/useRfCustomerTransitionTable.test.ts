import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import { useRfCustomerTransitionTable } from "../../hooks/useRfCustomerTransitionTable";
import type { RfCustomerTransitionTableResponse } from "../../types/customer-transition";

const mocks = vi.hoisted(() => ({
  fetchRfCustomerTransitionTable: vi.fn(),
}));

vi.mock("../../api/customer-transition-api", () => ({
  fetchRfCustomerTransitionTable: mocks.fetchRfCustomerTransitionTable,
}));

const emptyResponse: RfCustomerTransitionTableResponse = {
  data: {
    table: {
      current_calculation_run_id: null,
      rows: [],
    },
  },
};

describe("useRfCustomerTransitionTable", () => {
  beforeEach(() => {
    mocks.fetchRfCustomerTransitionTable.mockReset();
  });

  it("履歴がなくても取得成功として扱う", async () => {
    mocks.fetchRfCustomerTransitionTable.mockResolvedValue(emptyResponse);

    const { result } = renderHook(() => useRfCustomerTransitionTable());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.table).toEqual(emptyResponse.data.table);
    expect(result.current.errorMessage).toBeNull();
    expect(mocks.fetchRfCustomerTransitionTable).toHaveBeenCalledWith(
      expect.any(AbortSignal),
    );
  });

  it.each([
    {
      error: new ApiClientError("ログインが必要です", 401),
      message: "ログインが必要です",
    },
    {
      error: new Error("network error"),
      message: "RFランク客層変動表を取得できませんでした。",
    },
  ])("取得失敗時に「$message」を返す", async ({ error, message }) => {
    mocks.fetchRfCustomerTransitionTable.mockRejectedValue(error);

    const { result } = renderHook(() => useRfCustomerTransitionTable());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.table).toBeNull();
    expect(result.current.errorMessage).toBe(message);
  });

  it("再取得キーを変更すると失敗後に再取得できる", async () => {
    mocks.fetchRfCustomerTransitionTable
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(emptyResponse);

    const { result, rerender } = renderHook(
      ({ reloadKey }) => useRfCustomerTransitionTable(reloadKey),
      {
        initialProps: { reloadKey: 0 },
      },
    );

    await waitFor(() => {
      expect(result.current.errorMessage).not.toBeNull();
    });

    rerender({ reloadKey: 1 });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.table).toEqual(emptyResponse.data.table);
      expect(result.current.errorMessage).toBeNull();
    });

    expect(mocks.fetchRfCustomerTransitionTable).toHaveBeenCalledTimes(2);
  });

  it("画面から外れたら通信を中止する", () => {
    mocks.fetchRfCustomerTransitionTable.mockImplementation(
      () => new Promise(() => {}),
    );

    const { unmount } = renderHook(() => useRfCustomerTransitionTable());

    const signal = mocks.fetchRfCustomerTransitionTable.mock
      .calls[0][0] as AbortSignal;

    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
