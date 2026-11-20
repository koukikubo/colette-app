import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/api-client";
import {
  executeBulkResults,
  loadPendingReservations,
  prepareBulkResults,
} from "../../utils/reservation-bulk-results";
import { createReservation } from "../fixtures/reservation-fixtures";
const api = vi.hoisted(() => ({
  fetchReservations: vi.fn(),
  completeReservation: vi.fn(),
  cancelReservation: vi.fn(),
  noShowReservation: vi.fn(),
}));
vi.mock("@/features/reservations/api/reservation_api", () => api);
beforeEach(() => vi.resetAllMocks());
describe("選択予約の一括処理", () => {
  it("ページ取得中の件数変化を全選択の成功として扱わない", async () => {
    api.fetchReservations
      .mockResolvedValueOnce({
        data: {
          reservations: [createReservation()],
          pagination: { total_pages: 2, total_count: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          reservations: [],
          pagination: { total_pages: 1, total_count: 1 },
        },
      });
    await expect(loadPendingReservations()).rejects.toThrow(
      "取得中に未処理件数が変更",
    );
  });
  it("全選択は全ページを取得して重複を除き、保存APIを呼ばない", async () => {
    api.fetchReservations
      .mockResolvedValueOnce({
        data: {
          reservations: [createReservation()],
          pagination: { total_pages: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          reservations: [createReservation(), createReservation({ id: 2 })],
        },
      });
    expect(
      (await loadPendingReservations("2026-09-08")).map((item) => item.id),
    ).toEqual([1, 2]);
    expect(api.fetchReservations).toHaveBeenLastCalledWith(
      {
        state: "pending_checkout",
        date: "2026-09-08",
        page: 2,
        per_page: 100,
      },
      undefined,
    );
    expect(api.completeReservation).not.toHaveBeenCalled();
  });
  it("全期間の選択は日付なしで取得し、取得失敗を部分成功と扱わない", async () => {
    api.fetchReservations
      .mockResolvedValueOnce({
        data: {
          reservations: [createReservation()],
          pagination: { total_pages: 2 },
        },
      })
      .mockRejectedValueOnce(new Error("offline"));
    await expect(loadPendingReservations()).rejects.toThrow("offline");
    expect(api.fetchReservations).toHaveBeenNthCalledWith(
      1,
      {
        state: "pending_checkout",
        page: 1,
        per_page: 100,
      },
      undefined,
    );
  });
  it("仮予約の退店には明示確認を送るが、取消では受付状態を変更しない", () => {
    const tentative = createReservation({
      reservation_status: { id: 2, code: "tentative", label: "仮予約" },
    });
    expect(
      prepareBulkResults([tentative], "checkout")[0].payload.reservation
        .confirm_tentative,
    ).toBe(true);
    expect(
      prepareBulkResults([tentative], "cancel")[0].payload.reservation
        .confirm_tentative,
    ).toBeUndefined();
  });
  it("応答喪失で止め、成功済みを除いて同じ版・キー・本文で再送する", async () => {
    api.completeReservation
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("lost"));
    const original = prepareBulkResults(
      [
        createReservation(),
        createReservation({ id: 2 }),
        createReservation({ id: 3 }),
      ],
      "checkout",
    );
    const first = await executeBulkResults(original, "checkout", vi.fn());
    expect(first.map((item) => item.status)).toEqual([
      "success",
      "uncertain",
      "pending",
    ]);
    api.completeReservation.mockResolvedValue({});
    const retried = await executeBulkResults(first, "checkout", vi.fn());
    expect(retried.every((item) => item.status === "success")).toBe(true);
    expect(api.completeReservation.mock.calls.map((args) => args[0])).toEqual([
      1, 2, 2, 3,
    ]);
    expect(api.completeReservation.mock.calls[1]).toEqual(
      api.completeReservation.mock.calls[2],
    );
  });
  it("競合と入力拒否は失敗として残し、再送で最新情報を上書きしない", async () => {
    api.cancelReservation
      .mockRejectedValueOnce(
        new ApiClientError("他のスタッフが変更しました", 409),
      )
      .mockResolvedValueOnce({});
    const result = await executeBulkResults(
      prepareBulkResults(
        [createReservation(), createReservation({ id: 2 })],
        "cancel",
      ),
      "cancel",
      vi.fn(),
    );
    expect(result.map((item) => item.status)).toEqual(["failed", "success"]);
    await executeBulkResults(result, "cancel", vi.fn());
    expect(api.cancelReservation).toHaveBeenCalledTimes(2);
    expect(api.completeReservation).not.toHaveBeenCalled();
  });
  it("結果未確認の再試行が認証・CSRF拒否でも元の保存結果を確定扱いしない", async () => {
    api.completeReservation
      .mockRejectedValueOnce(new Error("lost"))
      .mockRejectedValueOnce(new ApiClientError("CSRF拒否", 422))
      .mockResolvedValueOnce({});
    const items = prepareBulkResults([createReservation()], "checkout");
    const first = await executeBulkResults(items, "checkout", vi.fn());
    const rejected = await executeBulkResults(first, "checkout", vi.fn());
    expect(rejected[0].status).toBe("uncertain");
    expect(rejected[0].key).toBe(items[0].key);
    const recovered = await executeBulkResults(rejected, "checkout", vi.fn());
    expect(recovered[0].status).toBe("success");
    expect(api.completeReservation.mock.calls[0]).toEqual(
      api.completeReservation.mock.calls[2],
    );
  });
  it("応答喪失後の確定した版競合は選び直し可能にし、残りの未送信を処理する", async () => {
    api.completeReservation
      .mockRejectedValueOnce(new Error("lost"))
      .mockRejectedValueOnce(
        new ApiClientError(
          "別の担当者が更新",
          409,
          [],
          "reservation_result_conflict",
        ),
      )
      .mockResolvedValueOnce({});
    const first = await executeBulkResults(
      prepareBulkResults(
        [createReservation(), createReservation({ id: 2 })],
        "checkout",
      ),
      "checkout",
      vi.fn(),
    );
    const retry = await executeBulkResults(first, "checkout", vi.fn());
    expect(retry.map((item) => item.status)).toEqual(["failed", "success"]);
  });
  it("認証拒否の後に残りを送り続けない", async () => {
    api.noShowReservation.mockRejectedValueOnce(
      new ApiClientError("ログインしてください", 401),
    );
    const result = await executeBulkResults(
      prepareBulkResults(
        [createReservation(), createReservation({ id: 2 })],
        "no_show",
      ),
      "no_show",
      vi.fn(),
    );
    expect(result.map((item) => item.status)).toEqual(["failed", "pending"]);
    expect(api.noShowReservation).toHaveBeenCalledTimes(1);
  });
});
