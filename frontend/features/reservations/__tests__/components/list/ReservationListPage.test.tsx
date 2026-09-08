import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReservationListPage } from "../../../components/layouts/displays/ReservationListPage";
import { ApiClientError } from "@/lib/api/api-client";
import { createReservation } from "../../fixtures/reservation-fixtures";

const mocks = vi.hoisted(() => ({
  fetchReservations: vi.fn(),
  fetchRestaurantMasters: vi.fn(),
}));

vi.mock("@/features/reservations/api/reservation_api", () => ({
  fetchReservations: mocks.fetchReservations,
}));

vi.mock("@/features/restaurant-masters/api/restaurant-masters-api", () => ({
  fetchRestaurantMasters: mocks.fetchRestaurantMasters,
}));

describe("ReservationListPage", () => {
  it("指定日の予約情報を取得し、予約がない日のサマリーを表示する", async () => {
    mocks.fetchReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [],
      },
    });

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    expect(
      screen.getByText("予約状況を読み込んでいます..."),
    ).toBeInTheDocument();

    const summary = await screen.findByRole("region", {
      name: "表示日の予約サマリー",
    });

    expect(within(summary).getByText("予約件数")).toBeInTheDocument();
    expect(within(summary).getByText("来店予定人数")).toBeInTheDocument();
    expect(within(summary).getByText("席未割当")).toBeInTheDocument();

    expect(within(summary).getAllByText("0件")).toHaveLength(2);
    expect(within(summary).getByText("0名")).toBeInTheDocument();

    expect(mocks.fetchReservations).toHaveBeenCalledWith(
      { date: "2026-09-08" },
      expect.any(AbortSignal),
    );

    expect(mocks.fetchRestaurantMasters).toHaveBeenCalledWith(
      expect.any(AbortSignal),
    );
  });

  it("予約一覧の取得に失敗すると、APIのエラーメッセージを表示する", async () => {
    mocks.fetchReservations.mockRejectedValue(
      new ApiClientError("予約情報を取得できませんでした。", 500),
    );

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("予約情報を取得できませんでした。");

    expect(mocks.fetchReservations).toHaveBeenCalledWith(
      { date: "2026-09-08" },
      expect.any(AbortSignal),
    );
  });

  it("予期しないエラーが発生すると、共通のエラーメッセージを表示する", async () => {
    mocks.fetchReservations.mockRejectedValue(
      new Error("予期しない処理エラー"),
    );

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent(
      "予約一覧の取得中に予期しないエラーが発生しました。",
    );
  });

  it("予約件数、来店予定人数、席未割当件数を集計して表示する", async () => {
    const assignedReservation = createReservation({
      id: 1,
      reservation_name: "山田 太郎",
      guest_count: 2,
      restaurant_master_ids: [10],
    });

    const unassignedReservation = createReservation({
      id: 2,
      reservation_name: "佐藤 花子",
      guest_count: 3,
      restaurant_master_ids: [],
    });

    mocks.fetchReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [assignedReservation, unassignedReservation],
      },
    });

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    const summary = await screen.findByRole("region", {
      name: "表示日の予約サマリー",
    });

    expect(within(summary).getByText("2件")).toBeInTheDocument();
    expect(within(summary).getByText("5名")).toBeInTheDocument();
    expect(within(summary).getByText("1件")).toBeInTheDocument();
  });
});
