import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/rf_customer_transitions/compare/route";
import { fetchRfMonthComparison } from "../../api/customer-transition-api";
const mocks = vi.hoisted(() => ({ proxyRequest: vi.fn(), apiFetch: vi.fn() }));
vi.mock("@/lib/api/proxy-request", () => ({
  proxyRequest: mocks.proxyRequest,
}));
vi.mock("@/lib/api/api-client", () => ({ apiFetch: mocks.apiFetch }));
it("forwards only comparison months to Rails", async () => {
  const request = new Request(
    "http://localhost/api/v1/rf_customer_transitions/compare?start_month=2026-07&end_month=2026-09&ignored=x",
  );
  await GET(request);
  expect(mocks.proxyRequest).toHaveBeenCalledWith(
    request,
    "/api/v1/rf_customer_transitions/compare?start_month=2026-07&end_month=2026-09",
  );
});
describe("month comparison client", () => {
  it("passes both months, cancellation and no-store", () => {
    const signal = new AbortController().signal;
    fetchRfMonthComparison("2026-07", "2026-09", signal);
    expect(mocks.apiFetch).toHaveBeenCalledWith(
      "/api/v1/rf_customer_transitions/compare?start_month=2026-07&end_month=2026-09",
      { signal, cache: "no-store" },
    );
  });
});
