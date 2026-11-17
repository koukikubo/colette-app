import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Next.jsのroute.tsからproxyRequestを経由してRailsへ送る内容を検証する。
// Railsへの実通信だけをfetchの差し替えで止める。
const fetchMock = vi.fn<typeof fetch>();

// proxyRequestは読み込み時にRAILS_API_URLを取得する。
// 各テストで設定した環境変数を使えるよう、設定後にroute.tsを読み込む。
async function callRoute(request: Request) {
  const { GET } = await import("@/app/api/v1/rf_rank_drops/route");

  return GET(request);
}

describe("RFランク低下APIルート", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("RAILS_API_URL", "http://rails.test");

    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("期間・ページ・ログインCookieをRailsへ中継する", async () => {
    const body = {
      status: "success",
      data: { state: "ready" },
    };

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const request = new Request(
      "http://localhost/api/v1/rf_rank_drops" +
        "?start_date=2026-11-01&end_date=2026-11-08&page=2&per_page=50",
      {
        headers: {
          Cookie: "_colette_session=test-session",
        },
      },
    );

    const response = await callRoute(request);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://rails.test/api/v1/rf_rank_drops" +
        "?start_date=2026-11-01&end_date=2026-11-08&page=2&per_page=50",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: expect.objectContaining({
          Cookie: "_colette_session=test-session",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(body);
  });

  it("検索条件がない場合もRailsへ中継する", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ status: "success", data: {} }), {
        status: 200,
      }),
    );

    await callRoute(new Request("http://localhost/api/v1/rf_rank_drops"));

    expect(fetchMock).toHaveBeenCalledWith(
      "http://rails.test/api/v1/rf_rank_drops",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it.each([400, 401, 422, 500])(
    "Railsのエラーステータス%sと本文をそのまま返す",
    async (status) => {
      const body = {
        status: "error",
        message: "取得できません",
        errors: ["テスト用のエラー"],
      };

      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const response = await callRoute(
        new Request("http://localhost/api/v1/rf_rank_drops"),
      );

      expect(response.status).toBe(status);
      expect(await response.json()).toEqual(body);
    },
  );

  it("RailsからのセッションCookie更新をブラウザ側へ返す", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ status: "success", data: {} }), {
        status: 200,
        headers: {
          "Set-Cookie": "_colette_session=renewed-session; Path=/; HttpOnly",
        },
      }),
    );

    const response = await callRoute(
      new Request("http://localhost/api/v1/rf_rank_drops"),
    );

    expect(response.headers.get("Set-Cookie")).toBe(
      "_colette_session=renewed-session; Path=/; HttpOnly",
    );
  });
});
