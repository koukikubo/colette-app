import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderWithRole } from "@/test-utils/auth";
import { DashboardPage } from "../components/DashboardPage";

const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("@/lib/api/api-client", async (original) => ({
  ...(await original<object>()),
  apiFetch: mocks.api,
}));
const summary = {
  date: "2027-01-01",
  summary: {
    reservation_count: 0,
    expected_guest_count: 0,
    completed_count: 0,
    canceled_count: 0,
    unassigned_count: 0,
    unconfirmed_count: 0,
  },
};
const analytics = {
  period: { current_month: "2027-01", year: 2027, through: "2027-01-01" },
  kpis: {
    monthly_reservations: 0,
    annual_visits: 0,
    new_customers: 0,
    returning_customer_count: 0,
    monthly_customer_count: 0,
    returning_customer_ratio: null,
    overdue_customers: 0,
  },
  monthly_series: Array.from({ length: 12 }, (_, i) => ({
    month: i === 11 ? "2027-01" : `2026-${String(i + 2).padStart(2, "0")}`,
    reservations: 0,
    visits: 0,
  })),
  rf: null,
  insights: Object.fromEntries(
    ["regular", "overdue", "new_returning", "slowing"].map((key) => [
      key,
      { count: 0, customers: [] },
    ]),
  ),
};
const success = (path: string) =>
  Promise.resolve({ data: path === "/api/v1/dashboard" ? summary : analytics });
beforeEach(() => mocks.api.mockReset());
afterEach(() => vi.useRealTimers());

it("片方の取得が応答待ちでも手動再試行でき、中断した旧結果を取り込まない", async () => {
  let resolveOld!: (value: unknown) => void;
  mocks.api.mockImplementation((path: string) =>
    path === "/api/v1/dashboard"
      ? new Promise((resolve) => {
          resolveOld = resolve;
        })
      : Promise.reject(new Error("offline")),
  );
  // 子の分析APIと親の本日集計が別々に失敗・待機しても、再取得の入口を塞がない。
  renderWithRole(<DashboardPage />, "viewer");
  await screen.findByRole("alert");
  const retry = screen.getByRole("button", { name: "最新情報に更新" });
  expect(retry).toBeEnabled();
  mocks.api.mockImplementation(success);
  fireEvent.click(retry);
  expect(await screen.findByText("算出できません")).toBeInTheDocument();
  await waitFor(() => expect(mocks.api).toHaveBeenCalledTimes(4));
  await act(async () =>
    resolveOld({
      data: {
        ...summary,
        summary: { ...summary.summary, reservation_count: 99 },
      },
    }),
  );
  expect(screen.queryByText("99件")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it.each(["owner", "operator", "viewer"] as const)(
  "%sも空状態・不足データと日付付き予約導線を確認できる",
  async (role) => {
    mocks.api.mockImplementation(success);
    renderWithRole(<DashboardPage />, role);
    expect(await screen.findByText("算出できません")).toBeInTheDocument();
    expect(
      screen.getByText(/適用済みのRF計算結果がありません/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "本日の予約一覧", hidden: true }),
    ).toHaveAttribute("href", "/reservations?date=2027-01-01");
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(
      screen.queryByText(/最終取得|本日の未完了予約|RFランク低下/),
    ).not.toBeInTheDocument();
  },
);

it("両APIは表示時と手動操作時だけ取得し、期間切替や時刻経過で再取得しない", async () => {
  vi.useFakeTimers();
  mocks.api.mockImplementation(success);
  await act(async () => renderWithRole(<DashboardPage />, "operator"));
  expect(mocks.api).toHaveBeenCalledTimes(2);
  await act(async () => {
    fireEvent.change(screen.getByRole("combobox", { name: "表示期間" }), {
      target: { value: "12" },
    });
    vi.advanceTimersByTime(60_000);
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(mocks.api).toHaveBeenCalledTimes(2);
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "最新情報に更新" })),
  );
  expect(mocks.api).toHaveBeenCalledTimes(4);
});
