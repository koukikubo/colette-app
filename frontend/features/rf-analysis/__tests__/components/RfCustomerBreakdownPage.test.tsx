import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { RfCustomerBreakdownPage } from "../../components/RfCustomerBreakdownPage";
const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("@/lib/api/api-client", async (original) => ({
  ...(await original<object>()),
  apiFetch: mocks.api,
}));
it("比較条件をURLに保持したまま顧客詳細へ進める", async () => {
  window.history.replaceState(
    null,
    "",
    "/rf-customers?run_id=2&comparison_run_id=1&category=down&page=2",
  );
  mocks.api.mockResolvedValue({
    data: {
      run: { id: 2, base_date: "2026-11-01" },
      comparison_run: { id: 1, base_date: "2026-10-31" },
      filters: { category: "down" },
      ranks: [],
      comparison_ranks: [],
      pagination: {
        current_page: 2,
        per_page: 20,
        total_pages: 2,
        total_count: 21,
      },
      customers: [
        {
          customer_id: 3,
          customer_name: "内訳対象",
          from_rank: { label: "A" },
          to_rank: { label: "B" },
          category: "down",
          to_state: "ranked",
          from_state: "ranked",
          last_visit_on: "2026-09-01",
          frequency_count: 3,
        },
      ],
    },
  });
  render(<RfCustomerBreakdownPage />);
  const link = await screen.findByRole("link", { name: "内訳対象" });
  expect(link.getAttribute("href")).toContain("/customers/3?return_to=");
  expect(decodeURIComponent(link.getAttribute("href")!)).toContain(
    "category=down&page=2",
  );
  expect(screen.getByText(/2026-10-31 → 2026-11-01/)).toBeInTheDocument();
});

it("セルの実際の期間と回数を条件欄に表示する", async () => {
  window.history.replaceState(
    null,
    "",
    "/rf-customers?run_id=2&recency_rule_id=1&frequency_rule_id=5",
  );
  mocks.api.mockResolvedValue({
    data: {
      run: { id: 2, base_date: "2026-11-01" },
      comparison_run: null,
      filters: { recency_rule_id: "1", frequency_rule_id: "5" },
      cell_labels: { recency: "90日以内", frequency: "6回以上" },
      ranks: [],
      comparison_ranks: [],
      customers: [],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_pages: 0,
        total_count: 0,
      },
    },
  });
  render(<RfCustomerBreakdownPage />);
  expect(await screen.findByText(/90日以内.*6回以上/)).toBeInTheDocument();
});

function breakdownData() {
  return {
    run: { id: 2, base_date: "2026-11-01" },
    comparison_run: { id: 1, base_date: "2026-10-01" },
    filters: { from_rank_id: "11", to_rank_id: "22" },
    ranks: [{ id: 22, label: "保存B" }],
    comparison_ranks: [{ id: 11, label: "保存A" }],
    pagination: {
      current_page: 2,
      per_page: 1,
      total_pages: 3,
      total_count: 3,
    },
    customers: [
      {
        customer_id: 3,
        customer_name: "固定履歴の対象",
        from_rank: { label: "保存A" },
        to_rank: { label: "保存B" },
        from_state: "ranked",
        to_state: "ranked",
        category: "down",
        last_visit_on: "2026-10-01",
        frequency_count: 2,
      },
    ],
  };
}

it("ランク単独の比較条件も省略せず表示する", async () => {
  window.history.replaceState(
    null,
    "",
    "/rf-customers?run_id=2&comparison_run_id=1&from_rank_id=11&to_rank_id=22",
  );
  mocks.api.mockResolvedValue({ data: breakdownData() });
  render(<RfCustomerBreakdownPage />);
  expect(
    await screen.findByText(/開始：保存A.*終了：保存B/),
  ).toBeInTheDocument();
});

it("APIの有効な件数を表示し、ページ操作と詳細の戻り先に履歴条件を保持する", async () => {
  const user = userEvent.setup();
  window.history.replaceState(
    null,
    "",
    "/rf-customers?run_id=2&comparison_run_id=1&category=down&page=2&per_page=1&return_to=%2Frf-customer-transitions%3Fstart_month%3D2026-10%26end_month%3D2026-11",
  );
  mocks.api.mockResolvedValue({ data: breakdownData() });
  render(<RfCustomerBreakdownPage />);
  await screen.findByRole("link", { name: "固定履歴の対象" });
  expect(
    screen.getByRole("combobox", { name: "1ページあたりの表示件数" }),
  ).toHaveTextContent("1件");
  expect(screen.getByRole("link", { name: "分析画面に戻る" })).toHaveAttribute(
    "href",
    "/rf-customer-transitions?start_month=2026-10&end_month=2026-11",
  );
  await user.click(screen.getByRole("button", { name: "次へ" }));
  await waitFor(() =>
    expect(new URLSearchParams(window.location.search).get("page")).toBe("3"),
  );
  const href = screen
    .getByRole("link", { name: "固定履歴の対象" })
    .getAttribute("href")!;
  const back = new URL(href, "http://localhost").searchParams.get("return_to")!;
  const params = new URL(back, "http://localhost").searchParams;
  expect(params.get("run_id")).toBe("2");
  expect(params.get("comparison_run_id")).toBe("1");
  expect(params.get("category")).toBe("down");
  expect(params.get("page")).toBe("3");
  expect(params.get("per_page")).toBe("1");
});

it("失敗を0件と扱わず同じ履歴条件で再取得し、外部への戻り先を使わない", async () => {
  const user = userEvent.setup();
  window.history.replaceState(
    null,
    "",
    "/rf-customers?run_id=2&rf_rank_id=22&return_to=%2F%2Fevil.example",
  );
  mocks.api
    .mockReset()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({
      data: {
        ...breakdownData(),
        customers: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 0,
          total_count: 0,
        },
      },
    });
  render(<RfCustomerBreakdownPage />);
  await screen.findByRole("alert");
  expect(
    screen.queryByText("この条件の顧客はいません。"),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "分析画面に戻る" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
  await user.click(screen.getByRole("button", { name: "再取得" }));
  expect(
    await screen.findByText("この条件の顧客はいません。"),
  ).toBeInTheDocument();
  expect(mocks.api).toHaveBeenLastCalledWith(
    expect.stringContaining("run_id=2&rf_rank_id=22"),
    expect.any(Object),
  );
});

it("条件なしでも履歴にない顧客まで含む全顧客とは表示しない", async () => {
  window.history.replaceState(null, "", "/rf-customers?run_id=2");
  mocks.api.mockResolvedValue({
    data: { ...breakdownData(), comparison_run: null, filters: {} },
  });
  render(<RfCustomerBreakdownPage />);
  expect(
    await screen.findByText(/条件：RFランクが付与された顧客/),
  ).toBeInTheDocument();
});
