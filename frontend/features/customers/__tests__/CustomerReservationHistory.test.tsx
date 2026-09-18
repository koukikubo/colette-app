import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createReservation } from "@/features/reservations/__tests__/fixtures/reservation-fixtures";
import { CustomerReservationHistory } from "../components/detail/CustomerReservationHistory";

const mocks = vi.hoisted(() => ({
  fetchCustomerReservations: vi.fn(),
}));

vi.mock("../api/customer-api", () => ({
  fetchCustomerReservations: mocks.fetchCustomerReservations,
}));

function createPagination(overrides = {}) {
  return {
    current_page: 1,
    per_page: 20,
    total_pages: 1,
    total_count: 1,
    ...overrides,
  };
}

describe("CustomerReservationHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("顧客の予約履歴を表示する", async () => {
    const reservation = createReservation({
      id: 30,
      customer_id: 10,
      reservation_name: "山田 太郎",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 2,
      restaurant_master_ids: [5],
      restaurant_masters: [
        {
          id: 5,
          restaurant_master_type_id: 1,
          sequence_number: 1,
          code: "T01",
          name: "テーブル1",
          capacity: 4,
          active: true,
        },
      ],
      reservation_status: {
        id: 1,
        code: "confirmed",
        label: "予約確定",
      },
    });

    mocks.fetchCustomerReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [reservation],
        pagination: createPagination(),
      },
    });

    render(<CustomerReservationHistory customerId={10} />);

    expect(
      screen.getByText("予約履歴を読み込んでいます..."),
    ).toBeInTheDocument();

    const history = await screen.findByRole("region", {
      name: "予約履歴",
    });

    expect(within(history).getByText("2026/09/08")).toBeInTheDocument();
    expect(within(history).getByText("18:00〜20:00")).toBeInTheDocument();
    expect(within(history).getByText("2名")).toBeInTheDocument();
    expect(within(history).getByText("テーブル1")).toBeInTheDocument();
    expect(within(history).getByText("予約確定")).toBeInTheDocument();

    expect(
      within(history).getByRole("link", {
        name: "予約30の詳細を開く",
      }),
    ).toHaveAttribute("href", "/reservations/30");

    expect(mocks.fetchCustomerReservations).toHaveBeenCalledWith(10, {
      page: 1,
      per_page: 20,
    });
  });

  it("予約履歴がない場合は空であることを表示する", async () => {
    mocks.fetchCustomerReservations.mockResolvedValue({
      status: "success",
      data: {
        reservations: [],
        pagination: createPagination({
          total_pages: 0,
          total_count: 0,
        }),
      },
    });

    render(<CustomerReservationHistory customerId={10} />);

    expect(
      await screen.findByText("この顧客の予約履歴はありません。"),
    ).toBeInTheDocument();
  });

  it("取得に失敗した場合はエラーを表示し再読み込みできる", async () => {
    const user = userEvent.setup();

    mocks.fetchCustomerReservations
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({
        status: "success",
        data: {
          reservations: [],
          pagination: createPagination({
            total_pages: 0,
            total_count: 0,
          }),
        },
      });

    render(<CustomerReservationHistory customerId={10} />);

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("予約履歴を取得できませんでした。");

    await user.click(
      within(alert).getByRole("button", {
        name: "再読み込み",
      }),
    );

    await waitFor(() => {
      expect(mocks.fetchCustomerReservations).toHaveBeenCalledTimes(2);
    });

    expect(
      await screen.findByText("この顧客の予約履歴はありません。"),
    ).toBeInTheDocument();
  });

  it("次ページを押すと次の予約履歴を取得する", async () => {
    const user = userEvent.setup();

    const firstPageReservation = createReservation({
      id: 30,
      customer_id: 10,
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
    });

    const secondPageReservation = createReservation({
      id: 20,
      customer_id: 10,
      starts_at: "2026-09-01T18:00:00+09:00",
      ends_at: "2026-09-01T20:00:00+09:00",
    });

    mocks.fetchCustomerReservations
      .mockResolvedValueOnce({
        status: "success",
        data: {
          reservations: [firstPageReservation],
          pagination: createPagination({
            current_page: 1,
            total_pages: 2,
            total_count: 21,
          }),
        },
      })
      .mockResolvedValueOnce({
        status: "success",
        data: {
          reservations: [secondPageReservation],
          pagination: createPagination({
            current_page: 2,
            total_pages: 2,
            total_count: 21,
          }),
        },
      });

    render(<CustomerReservationHistory customerId={10} />);

    expect(
      await screen.findByRole("link", {
        name: "予約30の詳細を開く",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "次へ",
      }),
    );

    expect(
      await screen.findByRole("link", {
        name: "予約20の詳細を開く",
      }),
    ).toBeInTheDocument();

    expect(mocks.fetchCustomerReservations).toHaveBeenLastCalledWith(10, {
      page: 2,
      per_page: 20,
    });
  });
});
