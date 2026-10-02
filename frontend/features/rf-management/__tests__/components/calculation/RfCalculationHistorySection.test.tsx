import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RfCalculationHistorySection } from "../../../components/calculation/RfCalculationHistorySection";

const mocks = vi.hoisted(() => ({
  useRfCalculationRuns: vi.fn(),
}));

vi.mock("../../../hooks/useRfCalculationRuns", () => ({
  useRfCalculationRuns: mocks.useRfCalculationRuns,
}));

vi.mock("../../../components/calculation/RfCalculationRunDetailDrawer", () => ({
  RfCalculationRunDetailDrawer: ({
    open,
    calculationRunId,
  }: {
    open: boolean;
    calculationRunId: number | null;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="RF計算履歴の詳細">
        選択中の履歴ID: {calculationRunId}
      </div>
    ) : null,
}));

describe("RfCalculationHistorySection", () => {
  beforeEach(() => {
    mocks.useRfCalculationRuns.mockReset();
  });

  it("計算履歴を表示する", () => {
    mocks.useRfCalculationRuns.mockReturnValue({
      calculationRuns: [
        {
          id: 20,
          rule_set: {
            id: 3,
            name: "標準RFルール",
            version: 3,
          },
          base_date: "2026-09-29",
          status: "completed",
          customer_count: 120,
          excluded_count: 8,
          unmatched_count: 2,
          started_by_staff: {
            id: 1,
            code: "00001",
            name: "管理者",
          },
          current: true,
          restorable: false,
        },
      ],
      pagination: {
        current_page: 1,
        per_page: 10,
        total_pages: 1,
        total_count: 1,
      },
      isLoading: false,
      errorMessage: null,
    });

    render(<RfCalculationHistorySection />);

    expect(screen.getByText("2026/09/29")).toBeInTheDocument();
    expect(screen.getByText("標準RFルール")).toBeInTheDocument();
    expect(screen.getByText("バージョン 3")).toBeInTheDocument();
    expect(screen.getByText("対象 120名")).toBeInTheDocument();
    expect(screen.getByText("対象外 8名")).toBeInTheDocument();
    expect(screen.getByText("未分類 2名")).toBeInTheDocument();
    expect(screen.getByText("管理者")).toBeInTheDocument();
    expect(screen.getByText("現在適用中")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "計算履歴20の詳細を開く",
      }),
    );

    expect(
      screen.getByRole("dialog", {
        name: "RF計算履歴の詳細",
      }),
    ).toHaveTextContent("選択中の履歴ID: 20");
  });

  it("履歴がない場合は空表示をする", () => {
    mocks.useRfCalculationRuns.mockReturnValue({
      calculationRuns: [],
      pagination: {
        current_page: 1,
        per_page: 10,
        total_pages: 0,
        total_count: 0,
      },
      isLoading: false,
      errorMessage: null,
    });

    render(<RfCalculationHistorySection />);

    expect(
      screen.getByText("RF計算履歴はまだありません。"),
    ).toBeInTheDocument();
  });

  it("取得に失敗した場合はエラーを表示する", () => {
    mocks.useRfCalculationRuns.mockReturnValue({
      calculationRuns: [],
      pagination: null,
      isLoading: false,
      errorMessage: "RF計算履歴を取得できませんでした。",
    });

    render(<RfCalculationHistorySection />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "RF計算履歴を取得できませんでした。",
    );
  });

  it("次へを押すと次ページを取得する", () => {
    mocks.useRfCalculationRuns.mockImplementation(
      ({ page }: { page: number }) => ({
        calculationRuns: [],
        pagination: {
          current_page: page,
          per_page: 10,
          total_pages: 2,
          total_count: 11,
        },
        isLoading: false,
        errorMessage: null,
      }),
    );

    render(<RfCalculationHistorySection />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "次へ",
      }),
    );

    expect(mocks.useRfCalculationRuns).toHaveBeenLastCalledWith({
      page: 2,
      perPage: 10,
    });
  });
});
