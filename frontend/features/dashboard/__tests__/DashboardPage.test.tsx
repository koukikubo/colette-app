import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithRole } from "@/test-utils/auth";
import { DashboardPage } from "../components/DashboardPage";
const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("@/lib/api/api-client", async (original) => ({
  ...(await original<object>()),
  apiFetch: mocks.api,
}));
vi.mock("@/features/rf-rank-drops/hooks/useRfRankDrops", () => ({
  useRfRankDrops: () => ({
    data: { state: "no_current_run" },
    isLoading: false,
    errorMessage: null,
  }),
}));
it("実データの予約件数を表示しRF未集計を0人と表示しない", async () => {
  mocks.api.mockResolvedValue({
    data: {
      date: "2026-11-13",
      as_of: "2026-11-13T03:00:00Z",
      summary: {
        reservation_count: 2,
        expected_guest_count: 3,
        completed_count: 1,
        canceled_count: 1,
        unassigned_count: 1,
        unconfirmed_count: 1,
      },
      reservations: [],
      rf: { base_date: null, monthly_state: null, monthly_error: null },
    },
  });
  renderWithRole(<DashboardPage />, "viewer");
  expect(await screen.findByText("2件")).toBeInTheDocument();
  expect(screen.getByText("3名")).toBeInTheDocument();
  expect(screen.getByText(/低下人数は未集計/)).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "新規予約" }),
  ).not.toBeInTheDocument();
});
it("取得失敗を空の予約や0件として表示しない", async () => {
  mocks.api.mockRejectedValue(new Error("offline"));
  renderWithRole(<DashboardPage />, "operator");
  expect(await screen.findByRole("alert")).toHaveTextContent("取得できません");
  expect(screen.queryByText("0件")).not.toBeInTheDocument();
});
