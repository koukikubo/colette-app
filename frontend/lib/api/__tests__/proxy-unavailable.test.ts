import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("上流接続失敗を内部情報のない統一JSONエラーに変換する", async () => {
  vi.stubEnv("RAILS_API_URL", "http://private-backend.test");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("secret upstream address")),
  );
  const { proxyRequest } = await import("../proxy-request");
  const response = await proxyRequest(
    new Request("http://localhost/api/test"),
    "/api/test",
  );
  expect(response.status).toBe(502);
  const body = await response.json();
  expect(body.status).toBe("error");
  expect(body.message).toContain("再試行");
  expect(JSON.stringify(body)).not.toContain("secret");
  expect(JSON.stringify(body)).not.toContain("private-backend");
});
