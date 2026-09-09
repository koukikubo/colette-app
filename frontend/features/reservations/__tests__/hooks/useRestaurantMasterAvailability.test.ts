import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import { useRestaurantMasterAvailability } from "../../hooks/useRestaurantMasterAvailability";

const mocks = vi.hoisted(() => ({
  fetchAvailabilities: vi.fn(),
}));

vi.mock("@/features/restaurant-masters/api/restaurant-masters-api", () => ({
  fetchRestaurantMasterAvailabilities: mocks.fetchAvailabilities,
}));

describe("useRestaurantMasterAvailability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("日時が正しい場合は300ms後に使用不可席を取得する", async () => {
    mocks.fetchAvailabilities.mockResolvedValue({
      data: { unavailable_restaurant_master_ids: [2, 3] },
    });

    const { result } = renderHook(() =>
      useRestaurantMasterAvailability({
        startsAt: "2026-09-08T18:00",
        endsAt: "2026-09-08T20:00",
        reservationId: 30,
      }),
    );

    expect(mocks.fetchAvailabilities).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.isAvailabilityLoading).toBe(false);
    expect(result.current.unavailableRestaurantMasterIds).toEqual([2, 3]);
    expect(mocks.fetchAvailabilities).toHaveBeenCalledWith(
      {
        starts_at: "2026-09-08T18:00",
        ends_at: "2026-09-08T20:00",
        reservation_id: 30,
      },
      expect.any(AbortSignal),
    );
  });

  it("日時が未入力または不正ならAPIを呼ばない", async () => {
    renderHook(() =>
      useRestaurantMasterAvailability({
        startsAt: "2026-09-08T20:00",
        endsAt: "2026-09-08T18:00",
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mocks.fetchAvailabilities).not.toHaveBeenCalled();
  });

  it("APIエラーのメッセージを返す", async () => {
    mocks.fetchAvailabilities.mockRejectedValue(
      new ApiClientError("空き状況を取得できません。", 500),
    );

    const { result } = renderHook(() =>
      useRestaurantMasterAvailability({
        startsAt: "2026-09-08T18:00",
        endsAt: "2026-09-08T20:00",
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.availabilityErrorMessage).toBe(
      "空き状況を取得できません。",
    );
    expect(result.current.unavailableRestaurantMasterIds).toEqual([]);
  });
});
