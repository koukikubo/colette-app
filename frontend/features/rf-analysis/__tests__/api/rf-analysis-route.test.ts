import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  proxyRequest: vi.fn(),
}));

vi.mock("@/lib/api/proxy-request", () => ({
  proxyRequest: mocks.proxyRequest,
}));

import { GET } from "@/app/api/v1/rf_analysis/route";

describe("RF分析APIルート", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("RF分析リクエストをRailsへ中継する", async () => {
    const response = new Response(null, { status: 200 });
    mocks.proxyRequest.mockResolvedValue(response);

    const request = new Request("http://localhost/api/v1/rf_analysis");

    await expect(GET(request)).resolves.toBe(response);

    expect(mocks.proxyRequest).toHaveBeenCalledWith(
      request,
      "/api/v1/rf_analysis",
    );
  });
});
