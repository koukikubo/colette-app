import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderWithRole } from "@/test-utils/auth";
import { DashboardPage } from "../components/DashboardPage";
const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("@/lib/api/api-client", async (original) => ({
  ...(await original<object>()),
  apiFetch: mocks.api,
}));
beforeEach(() => {
  mocks.api.mockReset();
});
afterEach(() => vi.useRealTimers());
it("予約件数を表示し、ダッシュボードにランク低下を表示しない", async () => {
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
  expect(
    screen.queryByRole("heading", { name: /RFランク低下/ }),
  ).not.toBeInTheDocument();
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

it("30秒経過やフォーカス復帰だけでは再取得せず、手動操作で更新する", async () => {
  vi.useFakeTimers();
  const data = {
    date: "2026-11-14",
    as_of: "2026-11-14T03:00:00Z",
    summary: {
      reservation_count: 2,
      expected_guest_count: 3,
      completed_count: 0,
      canceled_count: 0,
      unassigned_count: 0,
      unconfirmed_count: 0,
    },
    reservations: [],
    rf: { base_date: null, monthly_state: null, monthly_error: null },
  };
  mocks.api.mockResolvedValueOnce({ data }).mockResolvedValueOnce({
    data: { ...data, summary: { ...data.summary, reservation_count: 4 } },
  });
  await act(async () => {
    renderWithRole(<DashboardPage />, "owner");
  });
  expect(screen.getByText("2件")).toBeInTheDocument();
  await act(async () => {
    vi.advanceTimersByTime(60_000);
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(mocks.api).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByText("2件")).toBeInTheDocument();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "最新情報に更新" }));
  });
  expect(mocks.api).toHaveBeenCalledTimes(2);
  expect(screen.getByText("4件")).toBeInTheDocument();
});
