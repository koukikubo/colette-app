import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReservationFormOptions } from "../../hooks/useReservationFormOptions";

const mocks = vi.hoisted(() => ({
  fetchStandardCodes: vi.fn(),
  fetchRestaurantMasters: vi.fn(),
}));

vi.mock("@/features/standard-codes/api/standard-code-api", () => ({
  fetchStandardCodes: mocks.fetchStandardCodes,
}));

vi.mock("@/features/restaurant-masters/api/restaurant-masters-api", () => ({
  fetchRestaurantMasters: mocks.fetchRestaurantMasters,
}));

describe("useReservationFormOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("有効な基本コードに属する有効な選択肢だけを返す", async () => {
    const confirmed = {
      id: 1,
      code: "confirmed",
      name: "予約確定",
      active: true,
    };
    const inactive = { id: 2, code: "old", name: "旧状態", active: false };
    const tables = [{ id: 10, code: "T01", active: true }];

    mocks.fetchStandardCodes.mockResolvedValue({
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_status",
            active: true,
            items: [confirmed, inactive],
          },
          {
            id: 2,
            system_key: "reservation_route",
            active: false,
            items: [{ id: 3, code: "phone", name: "電話", active: true }],
          },
        ],
      },
    });
    mocks.fetchRestaurantMasters.mockResolvedValue({
      data: { restaurant_masters: tables },
    });

    const { result } = renderHook(() => useReservationFormOptions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reservationStatuses).toEqual([confirmed]);
    expect(result.current.reservationRoutes).toEqual([]);
    expect(result.current.restaurantMasters).toEqual(tables);
    expect(result.current.errorMessage).toBeNull();
  });

  it("どちらかの取得に失敗すると共通エラーを返す", async () => {
    mocks.fetchStandardCodes.mockRejectedValue(new Error("network error"));
    mocks.fetchRestaurantMasters.mockResolvedValue({
      data: { restaurant_masters: [] },
    });

    const { result } = renderHook(() => useReservationFormOptions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.errorMessage).toBe(
      "予約フォームのマスタ情報を取得できませんでした。",
    );
    expect(result.current.restaurantMasters).toEqual([]);
  });
});
