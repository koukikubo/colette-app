import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { RfRankDropListPageClient } from "../components/RfRankDropListPageClient";

vi.mock("../hooks/useRfRankDrops", () => ({
  useRfRankDrops: () => ({
    isLoading: false,
    errorMessage: null,
    data: {
      state: "no_history_in_period",
      start_date: "2026-11-01",
      end_date: "2026-11-13",
      current_run: null,
      skipped_comparisons: [],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_count: null,
        total_pages: null,
      },
      customers: [],
    },
  }),
}));

it("初回取得した期間を検索入力にも表示する", () => {
  render(<RfRankDropListPageClient />);
  expect(screen.getByLabelText("開始日")).toHaveValue("2026-11-01");
  expect(screen.getByLabelText("終了日")).toHaveValue("2026-11-13");
});
