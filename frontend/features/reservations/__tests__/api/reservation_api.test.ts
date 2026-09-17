import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api/api-client";
import { fetchReservations } from "../../api/reservation_api";

vi.mock("@/lib/api/api-client", () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

describe("fetchReservations", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("指定日と有効予約を検索条件として送信する", () => {
    fetchReservations({
      date: "2026-09-16",
      state: "active",
    });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/v1/reservations?date=2026-09-16&state=active",
      {
        cache: "no-store",
        signal: undefined,
      },
    );
  });

  it("指定日とキャンセル済み予約を検索条件として送信する", () => {
    fetchReservations({
      date: "2026-09-16",
      state: "canceled",
    });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/v1/reservations?date=2026-09-16&state=canceled",
      {
        cache: "no-store",
        signal: undefined,
      },
    );
  });

  it("検索条件がない場合はクエリ文字列を付けない", () => {
    fetchReservations();

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/reservations", {
      cache: "no-store",
      signal: undefined,
    });
  });
});
