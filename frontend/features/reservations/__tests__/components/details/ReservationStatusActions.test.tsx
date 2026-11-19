import { screen, waitFor } from "@testing-library/react";
import { renderWithOwner as render } from "@/test-utils/auth";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/api-client";
import { createReservation } from "../../fixtures/reservation-fixtures";
import { ReservationStatusActions } from "@/features/reservations/components/details/ReservationStatusActions";

const mocks = vi.hoisted(() => ({
  completeReservation: vi.fn(),
  cancelReservation: vi.fn(),
  noShowReservation: vi.fn(),
  correctReservationResult: vi.fn(),
  confirmReservationDetails: vi.fn(),
  refresh: vi.fn(),
  fetchReservation: vi.fn(),
}));
vi.mock("@/features/reservations/api/reservation_api", () => mocks);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
const booking = () =>
  createReservation({ details_confirmed_at: "2026-09-08T17:00:00+09:00" });

describe("ReservationStatusActions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("手動退店と無断キャンセルを表示し、未来予約では操作できない", () => {
    render(
      <ReservationStatusActions
        reservation={createReservation({
          starts_at: "2099-01-01T18:00:00+09:00",
        })}
      />,
    );
    expect(screen.getByRole("button", { name: "退店済にする" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "無断キャンセル" }),
    ).toBeDisabled();
  });

  it("退店を記録し、画面内の状態を更新する", async () => {
    const user = userEvent.setup();
    const reservation = booking();
    mocks.completeReservation.mockResolvedValue({
      data: {
        reservation: {
          ...reservation,
          completed_at: "2026-09-08T20:00:00+09:00",
          lock_version: 1,
        },
      },
    });
    render(<ReservationStatusActions reservation={reservation} />);
    await user.click(screen.getByRole("button", { name: "退店済にする" }));
    expect(mocks.completeReservation).toHaveBeenCalledWith(
      1,
      { reservation: { lock_version: 0 } },
      expect.any(String),
    );
    expect(
      await screen.findByRole("button", { name: "来店結果を訂正" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "退店済にする" }),
    ).not.toBeInTheDocument();
  });

  it("仮予約は確認してから確定と退店を一体で送信する", async () => {
    const user = userEvent.setup();
    const reservation = createReservation({
      reservation_status: { id: 2, code: "tentative", label: "仮予約" },
    });
    mocks.completeReservation.mockResolvedValue({
      data: {
        reservation: {
          ...reservation,
          completed_at: "2026-09-08T20:00:00+09:00",
          lock_version: 1,
        },
      },
    });
    render(<ReservationStatusActions reservation={reservation} />);
    await user.click(screen.getByRole("button", { name: "退店済にする" }));
    expect(mocks.completeReservation).not.toHaveBeenCalled();
    expect(
      screen.getByText("予約確定と退店を同時に記録しますか？"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "確定する" }));
    expect(mocks.completeReservation).toHaveBeenCalledWith(
      1,
      { reservation: { lock_version: 0, confirm_tentative: true } },
      expect.any(String),
    );
  });

  it("無断キャンセルに関わる訂正では理由欄を要求しない", async () => {
    const user = userEvent.setup();
    render(
      <ReservationStatusActions
        reservation={createReservation({
          completed_at: "2026-09-08T20:00:00+09:00",
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "来店結果を訂正" }));
    expect(screen.getByRole("button", { name: "確定する" })).toBeDisabled();
    await user.type(
      screen.getByLabelText("訂正理由（必須）"),
      "通常訂正で入力した理由",
    );
    await user.selectOptions(
      screen.getByLabelText("訂正後の来店結果"),
      "no_show",
    );
    expect(screen.queryByLabelText("訂正理由（必須）")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "確定する" })).toBeEnabled();
    mocks.correctReservationResult.mockResolvedValue({
      data: {
        reservation: createReservation({
          canceled_at: "2026-09-08T20:00:00+09:00",
          cancellation_kind: "no_show",
          lock_version: 1,
        }),
      },
    });
    await user.click(screen.getByRole("button", { name: "確定する" }));
    expect(mocks.correctReservationResult).toHaveBeenCalledWith(
      1,
      { reservation: { lock_version: 0, visit_result: "no_show", reason: "" } },
      expect.any(String),
    );
  });

  it("無断キャンセルからの訂正も理由不要", async () => {
    const user = userEvent.setup();
    const reservation = createReservation({
      canceled_at: "2026-09-08T20:00:00+09:00",
      cancellation_kind: "no_show",
    });
    mocks.correctReservationResult.mockResolvedValue({
      data: {
        reservation: {
          ...reservation,
          canceled_at: null,
          cancellation_kind: null,
          lock_version: 1,
        },
      },
    });
    render(<ReservationStatusActions reservation={reservation} />);
    await user.click(screen.getByRole("button", { name: "来店結果を訂正" }));
    await user.click(screen.getByRole("button", { name: "確定する" }));
    expect(mocks.correctReservationResult).toHaveBeenCalledWith(
      1,
      { reservation: { lock_version: 0, visit_result: "pending", reason: "" } },
      expect.any(String),
    );
  });

  it("通常の訂正には理由を入力して1回で送信する", async () => {
    const user = userEvent.setup();
    const reservation = createReservation({
      completed_at: "2026-09-08T20:00:00+09:00",
    });
    mocks.correctReservationResult.mockResolvedValue({
      data: {
        reservation: {
          ...reservation,
          completed_at: null,
          canceled_at: "2026-09-08T20:00:00+09:00",
          lock_version: 1,
        },
      },
    });
    render(<ReservationStatusActions reservation={reservation} />);
    await user.click(screen.getByRole("button", { name: "来店結果を訂正" }));
    await user.selectOptions(
      screen.getByLabelText("訂正後の来店結果"),
      "canceled",
    );
    await user.type(
      screen.getByLabelText("訂正理由（必須）"),
      "誤った退店操作",
    );
    await user.click(screen.getByRole("button", { name: "確定する" }));
    expect(mocks.correctReservationResult).toHaveBeenCalledWith(
      1,
      {
        reservation: {
          lock_version: 0,
          visit_result: "canceled",
          reason: "誤った退店操作",
        },
      },
      expect.any(String),
    );
  });

  it("応答喪失の再送では同じ入力・キーを使用する", async () => {
    const user = userEvent.setup();
    const reservation = booking();
    mocks.completeReservation
      .mockRejectedValueOnce(new ApiClientError("通信失敗", 502))
      .mockResolvedValueOnce({
        data: {
          reservation: {
            ...reservation,
            completed_at: "2026-09-08T20:00:00+09:00",
            lock_version: 1,
          },
        },
      });
    render(<ReservationStatusActions reservation={reservation} />);
    await user.click(screen.getByRole("button", { name: "退店済にする" }));
    await user.click(
      await screen.findByRole("button", { name: "同じ操作を再試行" }),
    );
    expect(mocks.completeReservation.mock.calls[1]).toEqual(
      mocks.completeReservation.mock.calls[0],
    );
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
  });

  it("保存後の一覧更新失敗を保存失敗として案内しない", async () => {
    const user = userEvent.setup();
    const reservation = booking();
    mocks.completeReservation.mockResolvedValue({
      data: {
        reservation: {
          ...reservation,
          completed_at: "2026-09-08T20:00:00+09:00",
          lock_version: 1,
        },
      },
    });
    render(
      <ReservationStatusActions
        reservation={reservation}
        onStatusChanged={() => {
          throw new Error("GET失敗");
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "退店済にする" }));
    expect(await screen.findByRole("status")).toHaveTextContent("保存済み");
    expect(
      screen.queryByRole("button", { name: "同じ操作を再試行" }),
    ).not.toBeInTheDocument();
  });
  it("409では最新内容と比較するまで確定を止め、理由を保持して再編集する", async () => {
    const user = userEvent.setup();
    const reservation = createReservation({
      completed_at: "2026-09-08T20:00:00+09:00",
    });
    mocks.correctReservationResult.mockRejectedValueOnce(
      new ApiClientError("競合", 409),
    );
    mocks.fetchReservation.mockResolvedValue({
      data: {
        reservation: { ...reservation, guest_count: 3, lock_version: 2 },
      },
    });
    render(<ReservationStatusActions reservation={reservation} />);
    await user.click(screen.getByRole("button", { name: "来店結果を訂正" }));
    await user.selectOptions(
      screen.getByLabelText("訂正後の来店結果"),
      "canceled",
    );
    await user.type(
      screen.getByLabelText("訂正理由（必須）"),
      "入力保全の確認",
    );
    await user.click(screen.getByRole("button", { name: "確定する" }));
    expect(
      await screen.findByRole("button", { name: "確定する" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "最新内容を確認して訂正を続ける" }),
    );
    expect(screen.getByLabelText("訂正理由（必須）")).toHaveValue(
      "入力保全の確認",
    );
    expect(screen.getByRole("button", { name: "確定する" })).toBeEnabled();
    mocks.correctReservationResult.mockResolvedValueOnce({
      data: {
        reservation: {
          ...reservation,
          completed_at: null,
          canceled_at: "2026-09-08T20:00:00+09:00",
          lock_version: 3,
        },
      },
    });
    await user.click(screen.getByRole("button", { name: "確定する" }));
    expect(mocks.correctReservationResult).toHaveBeenLastCalledWith(
      1,
      {
        reservation: {
          lock_version: 2,
          visit_result: "canceled",
          reason: "入力保全の確認",
        },
      },
      expect.any(String),
    );
  });
});
