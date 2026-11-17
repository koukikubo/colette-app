import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ proxy: vi.fn() }));
vi.mock("@/lib/api/proxy-request", () => ({ proxyRequest: mocks.proxy }));
import { GET } from "@/app/api/v1/reservation_calendar/route";
it.each(["", "?month=2026-08"])("選択月%sをRailsへ転送する", async (query) => {
  const response = new Response(null, { status: 200 });
  mocks.proxy.mockResolvedValue(response);
  const request = new Request(
    `http://localhost/api/v1/reservation_calendar${query}`,
  );
  expect(await GET(request)).toBe(response);
  expect(mocks.proxy).toHaveBeenCalledWith(
    request,
    `/api/v1/reservation_calendar${query}`,
  );
});
