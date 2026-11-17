import { screen } from "@testing-library/react";
import { renderWithOwner } from "@/test-utils/auth";
import { it, expect } from "vitest";
import { ReservationTimelineRow } from "../../../components/layouts/displays/ReservationTimelineRow";
import { createReservation } from "../../fixtures/reservation-fixtures";
it("予約のある開始枠は作らず、空き枠リンクに日付・時刻・席IDを保持する", () => {
  renderWithOwner(
    <ReservationTimelineRow
      restaurantMasterId={7}
      label="松"
      reservations={[
        createReservation({
          starts_at: "2026-11-15T18:00:00+09:00",
          ends_at: "2026-11-15T20:00:00+09:00",
        }),
      ]}
      targetDate="2026-11-15"
      currentTime={new Date("2026-11-15T12:00:00+09:00")}
      timelineStartMinutes={1020}
      timelineEndMinutes={1440}
      hourLabels={[1020, 1080, 1200, 1260, 1320]}
    />,
  );
  expect(
    screen.getByRole("link", { name: "松 2026-11-15 17:00から予約を登録" }),
  ).toHaveAttribute(
    "href",
    "/reservations/new?date=2026-11-15&time=17:00&table_id=7",
  );
  expect(
    screen.queryByRole("link", { name: "松 2026-11-15 18:00から予約を登録" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "松 2026-11-15 20:00から予約を登録" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "松 2026-11-15 22:00から予約を登録" }),
  ).not.toBeInTheDocument();
});
