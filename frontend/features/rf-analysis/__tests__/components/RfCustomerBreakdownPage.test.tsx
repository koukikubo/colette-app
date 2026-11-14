import { render, screen } from "@testing-library/react";
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
