import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { renderWithOwner } from "@/test-utils/auth";
import { CustomerListPageClient } from "../components/list/CustomerListPageClient";
const mocks = vi.hoisted(() => ({ list: vi.fn(), analytics: vi.fn() }));
vi.mock("../api/customer-api", () => ({
  fetchCustomers: mocks.list,
  fetchCustomerAnalytics: mocks.analytics,
}));
vi.mock("@/features/standard-codes/api/standard-code-api", () => ({
  fetchStandardCodes: vi
    .fn()
    .mockResolvedValue({ data: { standard_masters: [] } }),
}));
beforeEach(() => {
  window.history.replaceState(null, "", "/customers");
  mocks.list.mockReset().mockResolvedValue({
    data: {
      customers: [],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_count: 0,
        total_pages: 0,
      },
    },
  });
  mocks.analytics.mockReset().mockResolvedValue({
    data: {
      period: {
        month_from: "2026-11-01",
        through: "2026-11-24",
        ranking_from: "2025-11-24",
      },
      summary: {
        customer_count: 5,
        monthly_visits: 0,
        monthly_customers: 0,
        returning_customers: 0,
        returning_ratio: null,
      },
      ranking: [],
      rf_reference: { calculation_run_id: null, base_date: null, ranks: [] },
    },
  });
});
it("未検索時と入力中は明細を取得せず、検索後にだけ一覧を取得する", async () => {
  const user = userEvent.setup();
  renderWithOwner(<CustomerListPageClient />);
  await screen.findByText("表示中の顧客数");
  expect(mocks.list).not.toHaveBeenCalled();
  await user.type(
    screen.getByRole("searchbox", { name: "顧客検索キーワード" }),
    "浅井",
  );
  expect(mocks.list).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "検索" }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({ query: "浅井", page: 1 }),
    ),
  );
  await user.click(screen.getByRole("button", { name: "すべて解除" }));
  await screen.findByText("表示中の顧客数");
  const count = mocks.list.mock.calls.length;
  await act(async () => window.dispatchEvent(new Event("focus")));
  expect(mocks.list).toHaveBeenCalledTimes(count);
});
it("キーワードと来店条件を組み合わせてURLへ保存し、個別に解除できる", async () => {
  const user = userEvent.setup();
  renderWithOwner(<CustomerListPageClient />);
  await screen.findByText("表示中の顧客数");
  await user.type(
    screen.getByRole("searchbox", { name: "顧客検索キーワード" }),
    "浅井",
  );
  await user.click(screen.getByRole("button", { name: /絞り込み/ }));
  await user.type(screen.getByLabelText("最終来店日（開始）"), "2026-11-01");
  await user.type(screen.getByLabelText("来店回数（最小）"), "2");
  await user.click(screen.getByRole("button", { name: "適用" }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: "浅井",
        min_visits: 2,
        last_visit_from: "2026-11-01",
      }),
    ),
  );
  expect(window.location.search).toContain("min_visits=2");
  await user.click(screen.getByRole("button", { name: /来店条件を解除/ }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: "浅井",
        min_visits: undefined,
        last_visit_from: undefined,
      }),
    ),
  );
});

it("空欄での明示検索も終了して初期画面へ戻せる", async () => {
  const user = userEvent.setup();
  renderWithOwner(<CustomerListPageClient />);
  await screen.findByText("表示中の顧客数");
  await user.click(screen.getByRole("button", { name: "検索" }));
  await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(1));
  await user.click(screen.getByRole("button", { name: "検索を終了" }));
  await screen.findByText("表示中の顧客数");
  expect(window.location.search).toBe("");
});

it("検索済みURLの来店条件とページを復元する", async () => {
  window.history.replaceState(
    null,
    "",
    "/customers?searched=1&query=浅井&min_visits=2&max_visits=4&last_visit_to=2026-11-23&page=3&per_page=50",
  );
  renderWithOwner(<CustomerListPageClient />);
  await waitFor(() =>
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "浅井",
        min_visits: 2,
        max_visits: 4,
        last_visit_to: "2026-11-23",
        page: 3,
        per_page: 50,
      }),
    ),
  );
  expect(mocks.analytics).not.toHaveBeenCalled();
});

it("集計の通信失敗から再取得でき、来店がない場合の比率は算出不能と表示する", async () => {
  const user = userEvent.setup();
  mocks.analytics.mockRejectedValueOnce(new Error("offline"));
  renderWithOwner(<CustomerListPageClient />);
  await user.click(
    await screen.findByRole("button", { name: "集計を再読み込み" }),
  );
  expect(await screen.findByText("算出できません")).toBeInTheDocument();
  expect(mocks.list).not.toHaveBeenCalled();
});

it("同じ条件の再検索でも他端末の変更を再取得する", async () => {
  const user = userEvent.setup();
  renderWithOwner(<CustomerListPageClient />);
  await screen.findByText("表示中の顧客数");
  await user.type(
    screen.getByRole("searchbox", { name: "顧客検索キーワード" }),
    "浅井",
  );
  await user.click(screen.getByRole("button", { name: "検索" }));
  await screen.findByText("検索条件に一致する顧客が見つかりません");
  expect(mocks.list).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "検索" }));
  await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
});
