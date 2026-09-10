import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import { useReservation } from "../../hooks/useReservation";
import { createReservation } from "../fixtures/reservation-fixtures";

const mocks = vi.hoisted(() => ({
  fetchReservation: vi.fn(),
}));

vi.mock("../../api/reservation_api", () => ({
  fetchReservation: mocks.fetchReservation,
}));

describe("useReservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("指定IDの予約を取得する", async () => {
    const reservation = createReservation({ id: 30 });
    mocks.fetchReservation.mockResolvedValue({
      data: { reservation },
    });

    const { result } = renderHook(() => useReservation(30));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reservation).toEqual(reservation);
    expect(result.current.errorMessage).toBeNull();
    expect(mocks.fetchReservation).toHaveBeenCalledWith(
      30,
      expect.any(AbortSignal),
    );
  });

  it("予約が存在しない場合は専用メッセージを返す", async () => {
    mocks.fetchReservation.mockRejectedValue(
      new ApiClientError("Not Found", 404),
    );

    const { result } = renderHook(() => useReservation(999));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reservation).toBeNull();
    expect(result.current.errorMessage).toBe(
      "指定された予約が見つかりませんでした。",
    );
  });

  it("APIエラーの場合はAPIのメッセージを返す", async () => {
    mocks.fetchReservation.mockRejectedValue(
      new ApiClientError("予約情報を取得できませんでした。", 500),
    );

    const { result } = renderHook(() => useReservation(30));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.errorMessage).toBe(
      "予約情報を取得できませんでした。",
    );
  });

  it("予期しないエラーの場合は共通メッセージを返す", async () => {
    mocks.fetchReservation.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useReservation(30));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.errorMessage).toBe(
      "予約情報の取得中に予期しないエラーが発生しました。",
    );
  });
});
