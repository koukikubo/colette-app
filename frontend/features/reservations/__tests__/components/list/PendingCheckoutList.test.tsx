import { screen, waitFor, within } from "@testing-library/react";
import { renderWithOwner as render, renderWithRole } from "@/test-utils/auth";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PendingCheckoutList } from "../../../components/layouts/displays/PendingCheckoutList";
import { createReservation } from "../../fixtures/reservation-fixtures";

const fetchList = vi.hoisted(() => vi.fn());
const complete = vi.hoisted(() => vi.fn());
const cancel = vi.hoisted(() => vi.fn());
const noShow = vi.hoisted(() => vi.fn());
vi.mock("@/features/reservations/api/reservation_api", () => ({
  fetchReservations: fetchList,
  completeReservation: complete,
  cancelReservation: cancel,
  noShowReservation: noShow,
}));
vi.mock(
  "@/features/reservations/components/details/ReservationStatusActions",
  () => ({ ReservationStatusActions: () => null }),
);

describe("退店未処理の確認", () => {
  it("選択と処理内容の確認だけでは保存せず、確定後に選択分だけを取り消す", async () => {
    const user = userEvent.setup();
    fetchList.mockResolvedValue({
      data: {
        reservations: [
          createReservation(),
          createReservation({ id: 2, reservation_name: "鈴木 花子" }),
        ],
      },
    });
    cancel.mockResolvedValue({});
    render(<PendingCheckoutList targetDate="2026-09-08" />);
    await user.click(
      screen.getByRole("button", { name: "退店未処理の予約を確認" }),
    );
    await user.click(
      await screen.findByRole("checkbox", { name: "山田 太郎を選択" }),
    );
    await user.selectOptions(screen.getByLabelText("一括処理の内容"), "cancel");
    await user.click(
      screen.getByRole("button", { name: "選択した予約の処理を確認" }),
    );
    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByText(/1件の予約を通常キャンセル/),
    ).toBeInTheDocument();
    expect(cancel).not.toHaveBeenCalled();
    await user.click(
      within(dialog).getByRole("button", { name: "確認した内容で実行" }),
    );
    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    expect(cancel.mock.calls[0][0]).toBe(1);
    expect(complete).not.toHaveBeenCalled();
  });
  it("仮予約の一括退店は確認チェックが必要で、全選択だけでは保存しない", async () => {
    const user = userEvent.setup();
    fetchList.mockResolvedValue({
      data: {
        reservations: [
          createReservation({
            reservation_status: { id: 2, code: "tentative", label: "仮予約" },
          }),
        ],
      },
    });
    render(<PendingCheckoutList targetDate="2026-09-08" />);
    await user.click(
      screen.getByRole("button", { name: "退店未処理の予約を確認" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "過去分を含めて全選択" }),
    );
    await waitFor(() =>
      expect(screen.getByText("1件選択中")).toBeInTheDocument(),
    );
    expect(complete).not.toHaveBeenCalled();
    await user.selectOptions(
      screen.getByLabelText("一括処理の内容"),
      "checkout",
    );
    await user.click(
      screen.getByRole("button", { name: "選択した予約の処理を確認" }),
    );
    expect(
      screen.getByRole("button", { name: "確認した内容で実行" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("checkbox", { name: /仮予約1件を予約確定/ }),
    );
    expect(
      screen.getByRole("button", { name: "確認した内容で実行" }),
    ).toBeEnabled();
  });
  it("viewerにはチェックボックスと一括処理を表示しない", async () => {
    const user = userEvent.setup();
    fetchList.mockResolvedValue({
      data: { reservations: [createReservation()] },
    });
    renderWithRole(<PendingCheckoutList targetDate="2026-09-08" />, "viewer");
    await user.click(
      screen.getByRole("button", { name: "退店未処理の予約を確認" }),
    );
    await screen.findByRole("link", { name: /山田 太郎/ });
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("一括処理の内容")).not.toBeInTheDocument();
  });
  it("表示日だけの未処理一覧を取得し、ページ切替をAPIへ渡す", async () => {
    const user = userEvent.setup();
    fetchList.mockResolvedValue({
      data: {
        reservations: [createReservation()],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 2,
          total_count: 21,
        },
      },
    });
    render(<PendingCheckoutList targetDate="2026-09-08" />);
    expect(fetchList).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "退店未処理の予約を確認" }),
    );
    expect(
      await screen.findByRole("link", { name: /山田 太郎/ }),
    ).toHaveAttribute("href", "/reservations/detail/1");
    expect(fetchList).toHaveBeenCalledWith(
      { state: "pending_checkout", date: "2026-09-08", page: 1, per_page: 20 },
      expect.any(AbortSignal),
    );
    await user.click(screen.getByRole("button", { name: /次へ/ }));
    await waitFor(() =>
      expect(fetchList).toHaveBeenLastCalledWith(
        {
          state: "pending_checkout",
          date: "2026-09-08",
          page: 2,
          per_page: 20,
        },
        expect.any(AbortSignal),
      ),
    );
  });
});
