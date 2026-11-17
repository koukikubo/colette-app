import { screen } from "@testing-library/react";
import { renderWithOwner } from "@/test-utils/auth";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { DashboardAnalyticsPanel } from "../components/DashboardAnalyticsPanel";
const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@/hooks/useApiRead", () => ({ useApiRead: mocks.read }));
it("算出不能とRF未計算を示し、期間変更でグラフと表の実データを切り替える", async () => {
  mocks.read.mockReturnValue({
    loading: false,
    error: "",
    data: {
      period: { current_month: "2026-11", year: 2026, through: "2026-11-15" },
      kpis: {
        monthly_reservations: 0,
        annual_visits: 0,
        new_customers: 0,
        returning_customer_ratio: null,
        returning_customer_count: 0,
        monthly_customer_count: 0,
        overdue_customers: 0,
      },
      rf: null,
      monthly_series: Array.from({ length: 12 }, (_, index) => ({
        month: `2026-${String(index + 1).padStart(2, "0")}`,
        reservations: index,
        visits: index,
      })),
      insights: Object.fromEntries(
        ["regular", "overdue", "new_returning", "slowing"].map((key) => [
          key,
          { count: 0, customers: [] },
        ]),
      ),
    },
  });
  const user = userEvent.setup();
  renderWithOwner(<DashboardAnalyticsPanel reload={0} />);
  expect(screen.getByText("算出できません")).toBeInTheDocument();
  expect(
    screen.getByText(/適用済みのRF計算結果がありません/),
  ).toBeInTheDocument();
  await user.selectOptions(
    screen.getByRole("combobox", { name: "表示期間" }),
    "3",
  );
  expect(screen.getAllByRole("row", { hidden: true })).toHaveLength(4);
  expect(screen.getByRole("img")).toHaveAccessibleName(/月別の予約件数/);
});
it("取得失敗をゼロ件の分析として扱わない", () => {
  mocks.read.mockReturnValue({
    loading: false,
    error: "分析を取得できません",
    data: null,
  });
  renderWithOwner(<DashboardAnalyticsPanel reload={1} />);
  expect(screen.getByRole("alert")).toHaveTextContent("取得できません");
  expect(screen.queryByText("0名")).not.toBeInTheDocument();
});
