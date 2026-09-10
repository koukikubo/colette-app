import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReservationDateSearch } from "../../../components/form/ReservationDateSearch";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

describe("ReservationDateSearch", () => {
  it("翌日を押すと、翌日の予約一覧へ移動する", async () => {
    const user = userEvent.setup();

    render(<ReservationDateSearch targetDate="2026-12-31" />);

    await user.click(screen.getByRole("button", { name: "翌日" }));

    expect(mocks.push).toHaveBeenCalledWith("/reservations?date=2027-01-01");
  });

  it("前日を押すと、前日の予約一覧へ移動する", async () => {
    const user = userEvent.setup();

    render(<ReservationDateSearch targetDate="2026-01-01" />);

    await user.click(screen.getByRole("button", { name: "前日" }));

    expect(mocks.push).toHaveBeenCalledWith("/reservations?date=2025-12-31");
  });

  it("今日を押すと、日本時間の今日の予約一覧へ移動する", async () => {
    vi.useFakeTimers({
      toFake: ["Date"],
    });

    vi.setSystemTime(new Date("2026-09-08T01:00:00.000Z"));

    try {
      const user = userEvent.setup();

      render(<ReservationDateSearch targetDate="2026-09-01" />);

      await user.click(screen.getByRole("button", { name: "今日" }));

      expect(mocks.push).toHaveBeenCalledWith("/reservations?date=2026-09-08");
    } finally {
      vi.useRealTimers();
    }
  });
});
