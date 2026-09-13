import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createReservation } from "../../fixtures/reservation-fixtures";
import { ReservationStatusActions } from "@/features/reservations/components/details/ReservationStatusActions";

const mocks = vi.hoisted(() => ({
  completeReservation: vi.fn(),
  reopenReservation: vi.fn(),
  cancelReservation: vi.fn(),
  restoreReservation: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/features/reservations/api/reservation_api", () => ({
  completeReservation: mocks.completeReservation,
  reopenReservation: mocks.reopenReservation,
  cancelReservation: mocks.cancelReservation,
  restoreReservation: mocks.restoreReservation,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.refresh,
  }),
}));

describe("ReservationStatusActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未完了の予約には対応完了ボタンを表示する", () => {
    render(
      <ReservationStatusActions
        reservation={createReservation({
          completed_at: null,
          canceled_at: null,
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: "対応完了" }),
    ).toBeInTheDocument();
  });

  it("対応完了ボタンから予約を完了できる", async () => {
    const user = userEvent.setup();
    const reservation = createReservation({
      id: 30,
      lock_version: 2,
      completed_at: null,
      canceled_at: null,
    });

    mocks.completeReservation.mockResolvedValue({
      data: {
        reservation: {
          ...reservation,
          reservation_status: {
            id: 3,
            code: "completed",
            label: "対応完了",
          },
          completed_at: "2026-09-12T20:30:00+09:00",
          lock_version: 3,
        },
      },
    });

    render(<ReservationStatusActions reservation={reservation} />);

    await user.click(screen.getByRole("button", { name: "対応完了" }));

    expect(mocks.completeReservation).toHaveBeenCalledWith(30, {
      reservation: {
        lock_version: 2,
      },
    });

    await waitFor(() => {
      expect(mocks.refresh).toHaveBeenCalledOnce();
    });
  });

  it("対応完了済み予約には取り消しボタンを表示する", () => {
    render(
      <ReservationStatusActions
        reservation={createReservation({
          reservation_status: {
            id: 3,
            code: "completed",
            label: "対応完了",
          },
          completed_at: "2026-09-12T20:30:00+09:00",
        })}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "対応完了を取り消す",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "対応 対応完了" }),
    ).not.toBeInTheDocument();
  });

  it("対応完了を取り消して予約確定へ戻せる", async () => {
    const user = userEvent.setup();
    const reservation = createReservation({
      id: 30,
      lock_version: 3,
      reservation_status: {
        id: 3,
        code: "completed",
        label: "対応完了",
      },
      completed_at: "2026-09-12T20:30:00+09:00",
    });

    mocks.reopenReservation.mockResolvedValue({
      data: {
        reservation: {
          ...reservation,
          reservation_status: {
            id: 1,
            code: "confirmed",
            label: "予約確定",
          },
          completed_at: null,
          lock_version: 4,
        },
      },
    });

    render(<ReservationStatusActions reservation={reservation} />);

    await user.click(
      screen.getByRole("button", {
        name: "対応完了を取り消す",
      }),
    );

    expect(mocks.reopenReservation).toHaveBeenCalledWith(30, {
      reservation: {
        lock_version: 3,
      },
    });

    await waitFor(() => {
      expect(mocks.refresh).toHaveBeenCalledOnce();
    });
  });

  it("未完了の予約にはキャンセルボタンを表示する", () => {
    render(
      <ReservationStatusActions
        reservation={createReservation({
          completed_at: null,
          canceled_at: null,
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: "予約をキャンセル" }),
    ).toBeInTheDocument();
  });

  it("確認後に予約をキャンセルできる", async () => {
    const user = userEvent.setup();
    const reservation = createReservation({
      id: 30,
      lock_version: 2,
      completed_at: null,
      canceled_at: null,
    });

    mocks.cancelReservation.mockResolvedValue({});

    render(<ReservationStatusActions reservation={reservation} />);

    await user.click(screen.getByRole("button", { name: "予約をキャンセル" }));

    expect(
      screen.getByRole("alertdialog", {
        name: "予約をキャンセルしますか？",
      }),
    ).toBeInTheDocument();

    expect(mocks.cancelReservation).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", {
        name: "キャンセルを確定",
      }),
    );

    expect(mocks.cancelReservation).toHaveBeenCalledWith(30, {
      reservation: {
        lock_version: 2,
      },
    });

    await waitFor(() => {
      expect(mocks.refresh).toHaveBeenCalledOnce();
    });
  });

  it("キャンセル済み予約には復元ボタンを表示する", () => {
    render(
      <ReservationStatusActions
        reservation={createReservation({
          reservation_status: {
            id: 4,
            code: "canceled",
            label: "取消",
          },
          completed_at: null,
          canceled_at: "2026-09-12T18:00:00+09:00",
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: "予約を復元" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "対応完了" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "予約をキャンセル" }),
    ).not.toBeInTheDocument();
  });

  it("キャンセル済み予約を復元できる", async () => {
    const user = userEvent.setup();
    const reservation = createReservation({
      id: 30,
      lock_version: 3,
      reservation_status: {
        id: 4,
        code: "canceled",
        label: "取消",
      },
      completed_at: null,
      canceled_at: "2026-09-12T18:00:00+09:00",
    });

    mocks.restoreReservation.mockResolvedValue({});

    render(<ReservationStatusActions reservation={reservation} />);

    await user.click(
      screen.getByRole("button", {
        name: "予約を復元",
      }),
    );

    expect(mocks.restoreReservation).toHaveBeenCalledWith(30, {
      reservation: {
        lock_version: 3,
      },
    });

    await waitFor(() => {
      expect(mocks.refresh).toHaveBeenCalledOnce();
    });
  });
});
