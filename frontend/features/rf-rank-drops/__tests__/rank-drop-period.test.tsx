import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { RfRankDropListPageClient } from "../components/RfRankDropListPageClient";

const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("../hooks/useRfRankDrops", () => ({
  useRfRankDrops: mocks.read,
}));
const data = {
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
};
beforeEach(() => {
  mocks.read.mockReset();
  mocks.read.mockReturnValue({ isLoading: false, errorMessage: null, data });
});

it("当月一覧を主表示にし、期間入力を要求せず店舗日付の既定期間で取得する", () => {
  render(<RfRankDropListPageClient />);
  expect(
    screen.getByRole("heading", { name: "今月のRFランク低下顧客" }),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("開始日")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("終了日")).not.toBeInTheDocument();
  expect(
    screen.getByText(/対象期間：2026-11-01 ～ 2026-11-13/),
  ).toBeInTheDocument();
  const options = mocks.read.mock.lastCall![0];
  expect(options).toMatchObject({ page: 1, per_page: 20 });
  expect(options.start_date).toBeUndefined();
  expect(options.end_date).toBeUndefined();
});

it("当月の顧客・低下前後のランクと詳細への導線を一覧で表示する", () => {
  mocks.read.mockReturnValue({
    isLoading: false,
    errorMessage: null,
    data: {
      ...data,
      state: "ready",
      pagination: {
        current_page: 1,
        per_page: 20,
        total_count: 1,
        total_pages: 1,
      },
      customers: [
        {
          customer_id: 3,
          customer_name: "当月対象",
          detected_on: "2026-11-10",
          previous_rank: { label: "Aランク" },
          dropped_rank: { label: "Bランク" },
          latest_state: "ranked",
          latest_rank: { label: "Bランク" },
          last_visit_on: "2026-09-01",
        },
      ],
    },
  });
  render(<RfRankDropListPageClient />);
  expect(screen.getByRole("link", { name: "当月対象" })).toHaveAttribute(
    "href",
    "/customers/3",
  );
  expect(screen.getByRole("table")).toHaveTextContent("Aランク");
  expect(screen.getByRole("table")).toHaveTextContent("Bランク");
  expect(screen.getByRole("link", { name: "低下予定" })).toHaveAttribute(
    "href",
    "/rf-rank-drops/predictions",
  );
});

it("取得失敗は対象者なしと区別し、当月条件のまま再取得できる", () => {
  mocks.read.mockReturnValue({
    isLoading: false,
    errorMessage: "通信に失敗しました",
    data: null,
  });
  render(<RfRankDropListPageClient />);
  expect(screen.getByRole("alert")).toHaveTextContent("通信に失敗しました");
  expect(
    screen.queryByText("今月ランクが低下した顧客はいません。"),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
  expect(mocks.read.mock.lastCall![0]).toMatchObject({ reloadKey: 1, page: 1 });
});
