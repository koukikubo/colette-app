import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("削除APIの204を本文なしで返し、認証情報と本文を転送する", async () => {
  vi.resetModules();
  vi.stubEnv("RAILS_API_URL", "https://rails.example.test");

  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  const { proxyRequest } = await import("@/lib/api/proxy-request");

  const body = JSON.stringify({
    rf_rule_set: { lock_version: 0 },
  });

  const request = new Request(
    "https://frontend.example.test/api/v1/rf_rule_sets/7",
    {
      method: "DELETE",
      headers: {
        Cookie: "session=test-session",
        "X-CSRF-Token": "test-csrf",
        "Content-Type": "application/json",
      },
      body,
    },
  );

  const response = await proxyRequest(request, "/api/v1/rf_rule_sets/7");

  expect(response.status).toBe(204);
  expect(response.body).toBeNull();

  expect(fetchMock).toHaveBeenCalledWith(
    "https://rails.example.test/api/v1/rf_rule_sets/7",
    expect.objectContaining({
      method: "DELETE",
      body,
      headers: expect.objectContaining({
        Cookie: "session=test-session",
        "X-CSRF-Token": "test-csrf",
      }),
    }),
  );
});
