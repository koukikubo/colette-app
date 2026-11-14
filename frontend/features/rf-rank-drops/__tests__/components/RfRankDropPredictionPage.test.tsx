import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { RfRankDropPredictionPage } from "../../components/RfRankDropPredictionPage";
const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("@/lib/api/api-client", async (original) => ({
  ...(await original<object>()),
  apiFetch: mocks.api,
}));
it("指定期限をAPIへ渡し、初めて低下する日・残日数と顧客へのリンクを表示する", async () => {
  window.history.replaceState(
    null,
    "",
    "/rf-rank-drops/predictions?until_date=2026-12-31",
  );
  mocks.api.mockResolvedValue({
    data: {
      state: "ready",
      base_date: "2026-11-13",
      until_date: "2026-12-31",
      current_run: { id: 1, base_date: "2026-10-31", rule_set_id: 1 },
      pagination: {
        current_page: 1,
        per_page: 20,
        total_pages: 1,
        total_count: 1,
      },
      customers: [
        {
          customer_id: 3,
          customer_name: "予測対象",
          predicted_drop_on: "2026-11-21",
          days_until_drop: 8,
          current_rank: { label: "A" },
          predicted_rank: { label: "B" },
        },
      ],
    },
  });
  render(<RfRankDropPredictionPage />);
  expect(await screen.findByText("2026-11-21")).toBeInTheDocument();
  expect(screen.getByText("8日")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "予測対象" })).toHaveAttribute(
    "href",
    `/customers/3?return_to=${encodeURIComponent("/rf-rank-drops/predictions?page=1&per_page=20&until_date=2026-12-31")}`,
  );
  expect(mocks.api).toHaveBeenCalledWith(
    expect.stringContaining("until_date=2026-12-31"),
    expect.objectContaining({ cache: "no-store" }),
  );
});
it("予測できない状態を対象者0人と区別する", async () => {
  mocks.api.mockResolvedValue({
    data: {
      state: "no_current_run",
      base_date: "2026-11-13",
      until_date: "2027-02-13",
      current_run: null,
      customers: [],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_count: null,
        total_pages: null,
      },
    },
  });
  render(<RfRankDropPredictionPage />);
  expect(
    await screen.findByText(/適用中のRF結果がありません/),
  ).toBeInTheDocument();
  expect(screen.queryByText(/0人/)).not.toBeInTheDocument();
});
