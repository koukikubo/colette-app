import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createReservation } from "../../fixtures/reservation-fixtures";
import { CanceledReservationList } from "@/features/reservations/components/layouts/displays/CanceledReservationList";

vi.mock(
  "@/features/reservations/components/details/ReservationStatusActions",
  () => ({
    ReservationStatusActions: ({
      reservation,
    }: {
      reservation: { reservation_name: string };
    }) => <button type="button">{reservation.reservation_name}を復元</button>,
  }),
);

describe("CanceledReservationList", () => {
  it("キャンセル済み予約がない場合は空であることを表示する", () => {
    render(<CanceledReservationList reservations={[]} />);

    expect(
      screen.getByText("キャンセル済みの予約はありません。"),
    ).toBeInTheDocument();
  });

  it("キャンセル済み予約と復元操作を表示する", () => {
    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      guest_count: 2,
      starts_at: "2026-09-16T18:00:00+09:00",
      ends_at: "2026-09-16T20:00:00+09:00",
      canceled_at: "2026-09-15T12:00:00+09:00",
    });

    render(<CanceledReservationList reservations={[reservation]} />);

    expect(screen.getByText("山田 太郎")).toBeInTheDocument();
    expect(screen.getByText("2名")).toBeInTheDocument();
    expect(screen.getByText("18:00〜20:00")).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "山田 太郎様の予約詳細を開く",
      }),
    ).toHaveAttribute("href", "/reservations/30");

    expect(
      screen.getByRole("button", {
        name: "山田 太郎を復元",
      }),
    ).toBeInTheDocument();
  });
});
