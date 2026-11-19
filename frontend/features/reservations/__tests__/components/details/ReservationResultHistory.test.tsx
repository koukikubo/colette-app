import { screen } from "@testing-library/react";
import { renderWithOwner as render } from "@/test-utils/auth";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReservationResultHistory } from "../../../components/details/ReservationResultHistory";
import { createReservation } from "../../fixtures/reservation-fixtures";

const fetchHistory = vi.hoisted(() => vi.fn());
vi.mock("@/features/reservations/api/reservation_api", () => ({
  fetchReservationResultChanges: fetchHistory,
}));

describe("来店結果の変更履歴", () => {
  it("必要なときに取得し、取得失敗は予約を再保存せず再試行できる", async () => {
    const user = userEvent.setup();
    const snapshot = createReservation();
    fetchHistory
      .mockRejectedValueOnce(new Error("GET失敗"))
      .mockResolvedValueOnce({
        data: {
          changes: [
            {
              id: 1,
              operation: "no_show",
              reason: null,
              created_at: "2026-09-08T20:00:00+09:00",
              staff_name: "店主",
              before_state: snapshot,
              after_state: {
                ...snapshot,
                canceled_at: "2026-09-08T20:00:00+09:00",
                cancellation_kind: "no_show",
              },
            },
          ],
          pagination: {
            current_page: 1,
            per_page: 20,
            total_pages: 1,
            total_count: 1,
          },
        },
      });
    render(<ReservationResultHistory reservationId={1} version={1} />);
    expect(fetchHistory).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "来店結果の変更履歴" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "履歴を再取得" }),
    );
    expect(
      await screen.findByText("未退店 → 無断キャンセル"),
    ).toBeInTheDocument();
    expect(screen.getByText("理由：入力なし")).toBeInTheDocument();
    expect(fetchHistory).toHaveBeenCalledTimes(2);
  });
});
