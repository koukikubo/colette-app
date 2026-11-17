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

it("複数のSet-Cookieを個別に転送する", async () => {
  vi.stubEnv("RAILS_API_URL", "https://rails.example.test");
  const cookies = [
    "session=abc; HttpOnly; Path=/",
    "other=xyz; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/",
  ];
  const headers = new Headers();
  cookies.forEach((cookie) => headers.append("Set-Cookie", cookie));
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("{}", { headers })),
  );
  const { proxyRequest } = await import("@/lib/api/proxy-request");
  const response = await proxyRequest(
    new Request("https://frontend.example.test/api/v1/csrf"),
    "/api/v1/csrf",
  );
  expect(response.headers.getSetCookie()).toEqual(cookies);
});
