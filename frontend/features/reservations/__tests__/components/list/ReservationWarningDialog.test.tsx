import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ReservationWarningDialog } from "../../../components/layouts/displays/ReservationWarningDialog";

describe("ReservationWarningDialog", () => {
  it("次の予約までの残り時間を表示する", async () => {
    const user = userEvent.setup();

    render(
      <ReservationWarningDialog
        reservationName="佐藤 花子"
        nextReservationId={32}
        minutesUntilNextReservation={10}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "次の予約まで10分",
      }),
    );

    expect(
      screen.getByRole("alertdialog", {
        name: "次の予約が迫っています",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("佐藤 花子様の予約対応が終了予定時刻を過ぎています。"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "次の予約を確認",
      }),
    ).toHaveAttribute("href", "/reservations/32");
  });

  it("次の予約開始時刻を過ぎた場合は超過時間を表示する", async () => {
    const user = userEvent.setup();

    render(
      <ReservationWarningDialog
        reservationName="佐藤 花子"
        nextReservationId={32}
        minutesUntilNextReservation={-5}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "次の予約時刻を5分超過",
      }),
    );

    expect(
      screen.getByText("次の予約開始時刻を5分過ぎています。"),
    ).toBeInTheDocument();
  });
});
