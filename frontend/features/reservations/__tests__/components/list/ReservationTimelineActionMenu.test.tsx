import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createReservation } from "../../fixtures/reservation-fixtures";
import { ReservationTimelineActionMenu } from "@/features/reservations/components/layouts/displays/ReservationTimelineActionMenu";

vi.mock(
  "@/features/reservations/components/details/ReservationStatusActions",
  () => ({
    ReservationStatusActions: () => <div>予約状態操作</div>,
  }),
);

describe("ReservationTimelineActionMenu", () => {
  it("操作ボタンを押すと予約状態操作を表示する", async () => {
    const user = userEvent.setup();

    render(
      <ReservationTimelineActionMenu
        reservation={createReservation({
          reservation_name: "山田 太郎",
        })}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "山田 太郎様の予約操作を開く",
      }),
    );

    expect(screen.getByText("予約状態操作")).toBeInTheDocument();
  });
});
