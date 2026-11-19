import { screen, waitFor } from "@testing-library/react";
import { renderWithOwner as render } from "@/test-utils/auth";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PendingCheckoutList } from "../../../components/layouts/displays/PendingCheckoutList";
import { createReservation } from "../../fixtures/reservation-fixtures";

const fetchList = vi.hoisted(() => vi.fn());
vi.mock("@/features/reservations/api/reservation_api", () => ({
  fetchReservations: fetchList,
}));
vi.mock(
  "@/features/reservations/components/details/ReservationStatusActions",
  () => ({ ReservationStatusActions: () => null }),
);

describe("退店未処理の確認", () => {
  it("表示日を限定せず未処理一覧を取得し、ページ切替をAPIへ渡す", async () => {
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
    render(<PendingCheckoutList />);
    expect(fetchList).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "退店未処理の予約を確認" }),
    );
    expect(
      await screen.findByRole("link", { name: /山田 太郎/ }),
    ).toHaveAttribute("href", "/reservations/detail/1");
    expect(fetchList).toHaveBeenCalledWith(
      { state: "pending_checkout", page: 1, per_page: 20 },
      expect.any(AbortSignal),
    );
    await user.click(screen.getByRole("button", { name: /次へ/ }));
    await waitFor(() =>
      expect(fetchList).toHaveBeenLastCalledWith(
        { state: "pending_checkout", page: 2, per_page: 20 },
        expect.any(AbortSignal),
      ),
    );
  });
});
