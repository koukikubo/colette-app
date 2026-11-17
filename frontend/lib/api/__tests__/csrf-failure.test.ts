import { afterEach, expect, it, vi } from "vitest";
import { apiFetch, ApiClientError } from "../api-client";

afterEach(() => vi.unstubAllGlobals());

it("CSRFの403を保持し更新リクエストを送らない", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json(
      {
        status: "error",
        message: "権限がありません",
        errors: [],
      },
      { status: 403 },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  await expect(
    apiFetch("/api/v1/customers", { method: "POST", body: {} }),
  ).rejects.toMatchObject({
    name: "ApiClientError",
    status: 403,
    message: "権限がありません",
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it.each([
  new Response("upstream unavailable", { status: 502 }),
  Response.json({ status: "success", data: {} }),
])("CSRFの不正な応答でも更新を送らない", async (response) => {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  await expect(
    apiFetch("/api/v1/customers", { method: "POST", body: {} }),
  ).rejects.toBeInstanceOf(ApiClientError);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("CSRFを取得できた場合はトークン付きで更新する", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ status: "success", data: { csrf_token: "token" } }),
    )
    .mockResolvedValueOnce(Response.json({ status: "success", data: {} }));
  vi.stubGlobal("fetch", fetchMock);
  await apiFetch("/api/v1/customers", { method: "POST", body: {} });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(
    (fetchMock.mock.calls[1][1].headers as Headers).get("X-CSRF-Token"),
  ).toBe("token");
});
