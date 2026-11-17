import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("再送識別キーをNextからRailsまで保持する", async () => {
  vi.resetModules();
  vi.stubEnv("RAILS_API_URL", "https://rails.example.test");
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response("{}", { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  const { POST } = await import("@/app/api/v1/reservations/route");
  await POST(
    new Request("https://frontend.example.test/api/v1/reservations", {
      method: "POST",
      headers: {
        "Idempotency-Key": "test-operation-1234",
        "X-CSRF-Token": "csrf",
      },
      body: JSON.stringify({ reservation: { guest_count: 2 } }),
    }),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    "https://rails.example.test/api/v1/reservations",
    expect.objectContaining({
      headers: expect.objectContaining({
        "Idempotency-Key": "test-operation-1234",
        "X-CSRF-Token": "csrf",
      }),
    }),
  );
});
