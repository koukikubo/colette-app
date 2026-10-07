import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  proxyRequest: vi.fn(),
}));

vi.mock("@/lib/api/proxy-request", () => ({
  proxyRequest: mocks.proxyRequest,
}));

import { POST } from "@/app/api/v1/rf_calculation_runs/route";
import { PATCH } from "@/app/api/v1/rf_calculation_runs/[id]/activate/route";
import { PATCH as RESTORE } from "@/app/api/v1/rf_calculation_runs/[id]/restore/route";

describe("RF計算APIルート", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("計算実行リクエストをRailsへ中継する", async () => {
    const response = new Response(null, { status: 201 });
    mocks.proxyRequest.mockResolvedValue(response);

    const request = new Request("http://localhost/api/v1/rf_calculation_runs", {
      method: "POST",
      body: JSON.stringify({
        rf_calculation: {
          rf_rule_set_id: 3,
          base_date: "2026-10-02",
        },
      }),
    });

    await expect(POST(request)).resolves.toBe(response);

    expect(mocks.proxyRequest).toHaveBeenCalledWith(
      request,
      "/api/v1/rf_calculation_runs",
    );
  });

  it("計算結果の適用リクエストをRailsへ中継する", async () => {
    const response = new Response(null, { status: 200 });
    mocks.proxyRequest.mockResolvedValue(response);

    const request = new Request(
      "http://localhost/api/v1/rf_calculation_runs/20/activate",
      {
        method: "PATCH",
      },
    );

    await expect(
      PATCH(request, {
        params: Promise.resolve({ id: "20" }),
      }),
    ).resolves.toBe(response);

    expect(mocks.proxyRequest).toHaveBeenCalledWith(
      request,
      "/api/v1/rf_calculation_runs/20/activate",
    );
  });

  it("過去の計算結果の復元リクエストをRailsへ中継する", async () => {
    const response = new Response(null, { status: 200 });
    mocks.proxyRequest.mockResolvedValue(response);
    const request = new Request(
      "http://localhost/api/v1/rf_calculation_runs/19/restore",
      { method: "PATCH" },
    );

    await expect(
      RESTORE(request, { params: Promise.resolve({ id: "19" }) }),
    ).resolves.toBe(response);

    expect(mocks.proxyRequest).toHaveBeenCalledWith(
      request,
      "/api/v1/rf_calculation_runs/19/restore",
    );
  });
});
