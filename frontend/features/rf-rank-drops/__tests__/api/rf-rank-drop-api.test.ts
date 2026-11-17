import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchRfRankDrops } from "../../api/rf-rank-drop-api";
import type { RfRankDropResponse } from "../../types/rf-rank-drop";

// 取得関数からapiFetchを経由した通信まで検証する。
// 実際のサーバーへ接続しないよう、fetchだけを差し替える。
const fetchMock = vi.fn<typeof fetch>();

const responseBody: RfRankDropResponse = {
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

describe("RFランク低下APIの取得", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("条件未指定ではRails側の初期条件を使い、レスポンスを返す", async () => {
    const result = await fetchRfRankDrops();

    expect(result).toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/rf_rank_drops",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("期間とページ指定をクエリ文字列で送信する", async () => {
    await fetchRfRankDrops({
      start_date: "2026-11-01",
      end_date: "2026-11-08",
      page: 2,
      per_page: 50,
    });

    const [path] = fetchMock.mock.calls[0];
    const url = new URL(String(path), "http://localhost");

    expect(url.pathname).toBe("/api/v1/rf_rank_drops");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      start_date: "2026-11-01",
      end_date: "2026-11-08",
      page: "2",
      per_page: "50",
    });
  });

  it.each([20, 50, 100] as const)(
    "表示件数%sをそのまま送信する",
    async (perPage) => {
      await fetchRfRankDrops({ per_page: perPage });

      const [path] = fetchMock.mock.calls[0];
      const url = new URL(String(path), "http://localhost");

      expect(url.searchParams.get("per_page")).toBe(String(perPage));
    },
  );

  it("通信中止用のsignalをfetchまで引き継ぐ", async () => {
    const controller = new AbortController();

    await fetchRfRankDrops({ page: 2 }, controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/rf_rank_drops?page=2",
      expect.objectContaining({
        signal: controller.signal,
      }),
    );
  });

  it("未ログインのエラーを正常データとして返さない", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "error",
          message: "ログインが必要です",
          errors: [],
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(fetchRfRankDrops()).rejects.toMatchObject({
      name: "ApiClientError",
      status: 401,
      message: "ログインが必要です",
    });
  });
});
