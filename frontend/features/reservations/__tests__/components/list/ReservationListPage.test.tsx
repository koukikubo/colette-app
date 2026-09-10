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

  it("席未割当予約を要対応一覧に表示する", async () => {
    const reservation = createReservation({
      id: 15,
      reservation_name: "佐藤 花子",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      restaurant_master_ids: [],
      restaurant_masters: [],
    });

    mocks.fetchReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [reservation],
      },
    });

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    const section = await screen.findByRole("region", {
      name: "要対応：席未割当予約",
    });

    expect(within(section).getByText("佐藤 花子 様")).toBeInTheDocument();

    expect(within(section).getByText("18:00〜20:00")).toBeInTheDocument();

    expect(within(section).getByText("3名")).toBeInTheDocument();

    expect(
      within(section).getByRole("link", {
        name: "詳細",
      }),
    ).toHaveAttribute("href", "/reservations/15");

    expect(
      within(section).getByRole("link", {
        name: "席を割り当てる",
      }),
    ).toHaveAttribute("href", "/reservations/15/edit");
  });

  it("席割当済み予約を該当する席のタイムラインに表示する", async () => {
    const restaurantMaster = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    const reservation = createReservation({
      id: 20,
      reservation_name: "山田 太郎",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 2,
      restaurant_master_ids: [10],
      restaurant_masters: [
        {
          id: 10,
          code: "C01",
          name: "カウンター1",
          capacity: 2,
          restaurant_master_type_id: 0,
          sequence_number: 0,
          active: false,
        },
      ],
    });

    mocks.fetchReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [reservation],
      },
    });

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [restaurantMaster],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    expect(await screen.findByText("カウンター1")).toBeInTheDocument();

    expect(screen.getByText("C01 / 定員2名")).toBeInTheDocument();

    const reservationLink = screen.getByRole("link", {
      name: "山田 太郎様の予約詳細を開く",
    });

    expect(reservationLink).toHaveAttribute("href", "/reservations/20");

    expect(reservationLink).toHaveTextContent("山田 太郎");
    expect(reservationLink).toHaveTextContent("2名");
    expect(reservationLink).toHaveTextContent("18:00〜20:00");

    expect(
      screen.queryByRole("region", {
        name: "要対応：席未割当予約",
      }),
    ).not.toBeInTheDocument();
  });

  it("予約がない席には、予約なしと表示する", async () => {
    const restaurantMaster = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    mocks.fetchReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [],
      },
    });

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [restaurantMaster],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    expect(await screen.findByText("カウンター1")).toBeInTheDocument();
    expect(screen.getByText("C01 / 定員2名")).toBeInTheDocument();
    expect(screen.getByText("予約なし")).toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: /予約詳細を開く/,
      }),
    ).not.toBeInTheDocument();
  });

  it("翌日まで続く予約は、タイムライン上では24時までにクランプする", async () => {
    const restaurantMaster = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    const reservation = createReservation({
      id: 21,
      reservation_name: "佐藤 花子",
      starts_at: "2026-09-08T23:30:00+09:00",
      ends_at: "2026-09-09T00:30:00+09:00",
      restaurant_master_ids: [10],
      restaurant_masters: [
        {
          id: 10,
          code: "C01",
          name: "カウンター1",
          capacity: 2,
          restaurant_master_type_id: 1,
          sequence_number: 1,
          active: true,
        },
      ],
    });

    mocks.fetchReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [reservation],
      },
    });

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [restaurantMaster],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    const reservationLink = await screen.findByRole("link", {
      name: "佐藤 花子様の予約詳細を開く",
    });

    expect(reservationLink).toHaveTextContent("23:30〜00:30");

    expect(reservationLink).toHaveStyle({
      left: "92.85714285714286%",
      width: "7.142857142857142%",
    });
  });

  it("17時より前から始まる予約は、タイムライン上では17時から表示する", async () => {
    const restaurantMaster = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    const reservation = createReservation({
      id: 22,
      reservation_name: "鈴木 一郎",
      starts_at: "2026-09-08T16:30:00+09:00",
      ends_at: "2026-09-08T18:00:00+09:00",
      restaurant_master_ids: [10],
      restaurant_masters: [
        {
          id: 10,
          code: "C01",
          name: "カウンター1",
          capacity: 2,
          restaurant_master_type_id: 1,
          sequence_number: 1,
          active: true,
        },
      ],
    });

    mocks.fetchReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [reservation],
      },
    });

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [restaurantMaster],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    const reservationLink = await screen.findByRole("link", {
      name: "鈴木 一郎様の予約詳細を開く",
    });

    expect(reservationLink).toHaveTextContent("16:30〜18:00");

    expect(reservationLink).toHaveStyle({
      left: "0%",
      width: "14.285714285714285%",
    });
  });

  it("タイムラインの表示範囲と重ならない予約は描画しない", async () => {
    const restaurantMaster = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    const beforeTimelineReservation = createReservation({
      id: 23,
      reservation_name: "開始前予約",
      starts_at: "2026-09-08T16:00:00+09:00",
      ends_at: "2026-09-08T16:30:00+09:00",
      restaurant_master_ids: [10],
      restaurant_masters: [
        {
          id: 10,
          code: "C01",
          name: "カウンター1",
          capacity: 2,
          restaurant_master_type_id: 1,
          sequence_number: 1,
          active: true,
        },
      ],
    });

    const afterTimelineReservation = createReservation({
      id: 24,
      reservation_name: "終了後予約",
      starts_at: "2026-09-09T00:00:00+09:00",
      ends_at: "2026-09-09T01:00:00+09:00",
      restaurant_master_ids: [10],
      restaurant_masters: [
        {
          id: 10,
          code: "C01",
          name: "カウンター1",
          capacity: 2,
          restaurant_master_type_id: 1,
          sequence_number: 1,
          active: true,
        },
      ],
    });

    mocks.fetchReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [beforeTimelineReservation, afterTimelineReservation],
      },
    });

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [restaurantMaster],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    expect(await screen.findByText("カウンター1")).toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: "開始前予約様の予約詳細を開く",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: "終了後予約様の予約詳細を開く",
      }),
    ).not.toBeInTheDocument();

    const summary = screen.getByRole("region", {
      name: "表示日の予約サマリー",
    });

    expect(within(summary).getByText("2件")).toBeInTheDocument();
  });

  it("複数の席に割り当てられた予約を、それぞれの席行に表示する", async () => {
    const counter1 = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 1,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    const counter2 = {
      ...counter1,
      id: 11,
      sequence_number: 2,
      code: "C02",
      name: "カウンター2",
    };

    const reservation = createReservation({
      id: 25,
      reservation_name: "田中 二郎",
      starts_at: "2026-09-08T19:00:00+09:00",
      ends_at: "2026-09-08T21:00:00+09:00",
      guest_count: 2,
      restaurant_master_ids: [10, 11],
      restaurant_masters: [
        {
          id: 10,
          code: "C01",
          name: "カウンター1",
          capacity: 1,
          restaurant_master_type_id: 1,
          sequence_number: 1,
          active: true,
        },
        {
          id: 11,
          code: "C02",
          name: "カウンター2",
          capacity: 1,
          restaurant_master_type_id: 1,
          sequence_number: 2,
          active: true,
        },
      ],
    });

    mocks.fetchReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [reservation],
      },
    });

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [counter1, counter2],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    expect(await screen.findByText("カウンター1")).toBeInTheDocument();
    expect(screen.getByText("カウンター2")).toBeInTheDocument();

    const reservationLinks = screen.getAllByRole("link", {
      name: "田中 二郎様の予約詳細を開く",
    });

    expect(reservationLinks).toHaveLength(2);

    expect(reservationLinks[0]).toHaveAttribute("href", "/reservations/25");

    expect(reservationLinks[1]).toHaveAttribute("href", "/reservations/25");

    expect(
      screen.queryByRole("region", {
        name: "要対応：席未割当予約",
      }),
    ).not.toBeInTheDocument();
  });

  it("席を席種と表示順の昇順でタイムラインに表示する", async () => {
    const baseRestaurantMaster = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 1,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    const counter1 = {
      ...baseRestaurantMaster,
      id: 10,
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
    };

    const counter2 = {
      ...baseRestaurantMaster,
      id: 11,
      sequence_number: 2,
      code: "C02",
      name: "カウンター2",
    };

    const table1 = {
      ...baseRestaurantMaster,
      id: 20,
      restaurant_master_type_id: 2,
      restaurant_master_type: {
        id: 2,
        code: "table",
        label: "テーブル席",
      },
      sequence_number: 1,
      code: "T01",
      name: "テーブル1",
      capacity: 4,
    };

    mocks.fetchReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [],
      },
    });

    // 意図的に表示順とは異なる順番で返す
    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [table1, counter2, counter1],
      },
    });

    render(<ReservationListPage targetDate="2026-09-08" />);

    expect(await screen.findByText("カウンター1")).toBeInTheDocument();

    const seatNames = screen
      .getAllByText(/^(カウンター1|カウンター2|テーブル1)$/)
      .map((element) => element.textContent);

    expect(seatNames).toEqual(["カウンター1", "カウンター2", "テーブル1"]);
  });
});
