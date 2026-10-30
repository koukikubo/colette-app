import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import {
  fetchRfCustomerMovements,
  fetchRfCustomerTransitionTable,
} from "../../api/customer-transition-api";

describe("RFランク客層変動表の取得", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("履歴一覧を取得する", async () => {
    const body = {
      status: "success",
      data: {
        table: {
          current_calculation_run_id: null,
          rows: [],
        },
      },
    };

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const controller = new AbortController();

    const result = await fetchRfCustomerTransitionTable(controller.signal);

    expect(result).toEqual(body);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/rf_customer_transitions",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        credentials: "include",
        signal: controller.signal,
      }),
    );
  });

  it("選択した計算履歴の移動内訳を取得する", async () => {
    const body = {
      status: "success",
      data: {
        calculation_run_id: 20,
        movement: {
          comparison_run_id: null,
          counts: null,
          transitions: [],
        },
      },
    };

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const controller = new AbortController();

    const result = await fetchRfCustomerMovements(20, controller.signal);

    expect(result).toEqual(body);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/rf_customer_transitions/20/movements",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      }),
    );
  });

  it("取得に失敗した場合はエラーを呼び出し元へ返す", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "error",
          message: "データが見つかりませんでした",
          errors: [],
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(fetchRfCustomerMovements(999)).rejects.toBeInstanceOf(
      ApiClientError,
    );
  });
});
