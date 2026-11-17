// useRfRankDropsの取得状態と、条件変更時の通信制御を検証する。
// API関数をモックし、通信の成功・失敗・完了順序をテスト側で操作する。

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import { fetchRfRankDrops } from "../../api/rf-rank-drop-api";
import { useRfRankDrops } from "../../hooks/useRfRankDrops";
import type { RfRankDropResponse } from "../../types/rf-rank-drop";

vi.mock("../../api/rf-rank-drop-api", () => ({
  fetchRfRankDrops: vi.fn(),
}));

const fetchMock = vi.mocked(fetchRfRankDrops);

// APIの成功応答を作る。
// runIdを変えることで、どの通信結果がHookに反映されたかを判別する。
function buildResponse(runId = 1): RfRankDropResponse {
  return {
    status: "success",
    data: {
      state: "ready",
      start_date: "2026-11-01",
      end_date: "2026-11-08",
      current_run: {
        id: runId,
        base_date: "2026-11-08",
        rule_set_id: 1,
      },
      skipped_comparisons: [],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_count: 0,
        total_pages: 0,
      },
      customers: [],
    },
  };
}

// 完了タイミングをテストから指定できる通信結果を作る。
// ページ変更前後の通信が逆順に完了する状況を再現するために使う。
function createPendingResponse() {
  let resolve!: (response: RfRankDropResponse) => void;

  const promise = new Promise<RfRankDropResponse>((complete) => {
    resolve = complete;
  });

  return { promise, resolve };
}

describe("useRfRankDrops", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(buildResponse());
  });

  it("初期条件で取得し、結果と読み込み終了を返す", async () => {
    const response = buildResponse();
    fetchMock.mockResolvedValueOnce(response);

    const { result } = renderHook(() => useRfRankDrops());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      {
        start_date: undefined,
        end_date: undefined,
        page: 1,
        per_page: 20,
      },
      expect.any(AbortSignal),
    );
    expect(result.current.data).toEqual(response.data);
    expect(result.current.errorMessage).toBeNull();
  });

  it("指定された期間・ページ・表示件数をAPI関数へ渡す", async () => {
    renderHook(() =>
      useRfRankDrops({
        start_date: "2026-10-01",
        end_date: "2026-10-31",
        page: 2,
        per_page: 50,
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        {
          start_date: "2026-10-01",
          end_date: "2026-10-31",
          page: 2,
          per_page: 50,
        },
        expect.any(AbortSignal),
      );
    });
  });

  it("比較できない状態も正常な取得結果として保持する", async () => {
    const response: RfRankDropResponse = {
      status: "success",
      data: {
        state: "no_current_run",
        start_date: "2026-11-01",
        end_date: "2026-11-08",
        current_run: null,
        skipped_comparisons: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_count: null,
          total_pages: null,
        },
        customers: [],
      },
    };

    fetchMock.mockResolvedValueOnce(response);

    const { result } = renderHook(() => useRfRankDrops());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(response.data);
    expect(result.current.errorMessage).toBeNull();
  });

  it("APIエラーのメッセージを返す", async () => {
    fetchMock.mockRejectedValueOnce(
      new ApiClientError("ログインしてください。", 401),
    );

    const { result } = renderHook(() => useRfRankDrops());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.errorMessage).toBe("ログインしてください。");
  });

  it("検索条件の具体的な修正理由を表示する", async () => {
    fetchMock.mockRejectedValueOnce(
      new ApiClientError("検索条件が不正です", 400, [
        "開始日は終了日以前を指定してください",
      ]),
    );
    const { result } = renderHook(() => useRfRankDrops());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.errorMessage).toBe(
      "検索条件が不正です / 開始日は終了日以前を指定してください",
    );
  });

  it("通信などの予期しないエラーには共通メッセージを返す", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useRfRankDrops());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.errorMessage).toBe(
      "RFランク低下顧客を取得できませんでした。",
    );
  });

  it("reloadKeyの変更で再取得し、前回のエラーを解除する", async () => {
    fetchMock.mockRejectedValueOnce(
      new ApiClientError("取得に失敗しました。", 500),
    );

    const { result, rerender } = renderHook(
      ({ reloadKey }) => useRfRankDrops({ reloadKey }),
      { initialProps: { reloadKey: 0 } },
    );

    await waitFor(() => {
      expect(result.current.errorMessage).toBe("取得に失敗しました。");
    });

    rerender({ reloadKey: 1 });

    await waitFor(() => {
      expect(result.current.data).toEqual(buildResponse().data);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("ページ変更後に古い通信が完了しても結果を上書きしない", async () => {
    const first = createPendingResponse();
    const second = createPendingResponse();

    fetchMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(
      ({ page }) => useRfRankDrops({ page }),
      { initialProps: { page: 1 } },
    );

    const firstSignal = fetchMock.mock.calls[0][1];

    rerender({ page: 2 });

    expect(firstSignal?.aborted).toBe(true);
    expect(fetchMock.mock.calls[1][0]?.page).toBe(2);

    // 新しいページの取得結果を先に返す。
    await act(async () => {
      second.resolve(buildResponse(2));
    });

    expect(result.current.data?.current_run?.id).toBe(2);

    // 古いページの結果が後から届いても、新しい結果を維持する。
    await act(async () => {
      first.resolve(buildResponse(1));
    });

    expect(result.current.data?.current_run?.id).toBe(2);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("古い通信の失敗で新しい通信の読み込み状態を終了しない", async () => {
    let rejectFirst!: (error: Error) => void;

    const firstPromise = new Promise<RfRankDropResponse>((_, reject) => {
      rejectFirst = reject;
    });
    const second = createPendingResponse();

    fetchMock
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(
      ({ page }) => useRfRankDrops({ page }),
      { initialProps: { page: 1 } },
    );

    rerender({ page: 2 });

    await act(async () => {
      rejectFirst(new Error("古い通信の失敗"));
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.errorMessage).toBeNull();

    await act(async () => {
      second.resolve(buildResponse(2));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data?.current_run?.id).toBe(2);
  });

  it("画面から取り除かれたときに通信をキャンセルする", async () => {
    const pending = createPendingResponse();
    fetchMock.mockReturnValueOnce(pending.promise);

    const { unmount } = renderHook(() => useRfRankDrops());
    const signal = fetchMock.mock.calls[0][1];

    unmount();

    expect(signal?.aborted).toBe(true);

    await act(async () => {
      pending.resolve(buildResponse());
    });
  });
});
