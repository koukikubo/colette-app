import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReservationTimelineRow } from "../../../components/layouts/displays/ReservationTimelineRow";
import { createReservation } from "../../fixtures/reservation-fixtures";

describe("ReservationTimelineRow", () => {
  it("現在時刻に応じた表示状態を予約バーへ渡す", () => {
    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      starts_at: "2026-09-14T18:00:00+09:00",
      ends_at: "2026-09-14T20:00:00+09:00",
      completed_at: null,
      canceled_at: null,
    });

    render(
      <ReservationTimelineRow
        label="カウンター1"
        description="C01 / 定員2名"
        reservations={[reservation]}
        targetDate="2026-09-14"
        currentTime={new Date("2026-09-14T19:00:00+09:00")}
        timelineStartMinutes={17 * 60}
        timelineEndMinutes={24 * 60}
        hourLabels={[17 * 60, 18 * 60, 19 * 60, 20 * 60]}
      />,
    );

    const reservationLink = screen.getByRole("link", {
      name: "山田 太郎様の予約詳細を開く",
    });

    expect(reservationLink).toHaveAttribute(
      "data-timeline-state",
      "in_progress",
    );
  });
});
