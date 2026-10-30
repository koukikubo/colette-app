import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  proxyRequest: vi.fn(),
}));

vi.mock("@/lib/api/proxy-request", () => ({
  proxyRequest: mocks.proxyRequest,
}));

import { GET as GET_TABLE } from "@/app/api/v1/rf_customer_transitions/route";
import { GET as GET_MOVEMENTS } from "@/app/api/v1/rf_customer_transitions/[id]/movements/route";

describe("RFランク客層変動表APIルート", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("履歴一覧のリクエストをRailsへ中継する", async () => {
    const response = new Response(null, { status: 200 });
    mocks.proxyRequest.mockResolvedValue(response);

    const request = new Request(
      "http://localhost/api/v1/rf_customer_transitions",
    );

    await expect(GET_TABLE(request)).resolves.toBe(response);

    expect(mocks.proxyRequest).toHaveBeenCalledWith(
      request,
      "/api/v1/rf_customer_transitions",
    );
  });

  it("選択した計算履歴の移動内訳をRailsへ中継する", async () => {
    const response = new Response(null, { status: 200 });
    mocks.proxyRequest.mockResolvedValue(response);

    const request = new Request(
      "http://localhost/api/v1/rf_customer_transitions/20/movements",
    );

    await expect(
      GET_MOVEMENTS(request, {
        params: Promise.resolve({ id: "20" }),
      }),
    ).resolves.toBe(response);

    expect(mocks.proxyRequest).toHaveBeenCalledWith(
      request,
      "/api/v1/rf_customer_transitions/20/movements",
    );
  });
});
