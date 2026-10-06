import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RfCalculationRunDetailDrawer } from "../../../components/calculation/RfCalculationRunDetailDrawer";

const mocks = vi.hoisted(() => ({
  activateRfCalculationRun: vi.fn(),
  useAuth: vi.fn(),
  useRfCalculationRunDetail: vi.fn(),
}));

vi.mock("@/features/staff-auth/hooks/use-auth", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("../../../api/rf-management-api", () => ({
  activateRfCalculationRun: mocks.activateRfCalculationRun,
}));

vi.mock("../../../hooks/useRfCalculationRunDetail", () => ({
  useRfCalculationRunDetail: mocks.useRfCalculationRunDetail,
}));

vi.mock("../../../components/calculation/RfCalculationResultsSection", () => ({
  RfCalculationResultsSection: ({
    calculationRunId,
  }: {
    calculationRunId: number;
  }) => <div>顧客別判定結果: {calculationRunId}</div>,
}));

describe("RfCalculationRunDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activateRfCalculationRun.mockResolvedValue({});
    mocks.useAuth.mockReturnValue({
      staff: {
        staff_master: {
          role_code: "owner",
        },
      },
    });
  });

  it("開いている場合は選択した計算履歴の詳細を表示する", () => {
    mocks.useRfCalculationRunDetail.mockReturnValue({
      calculationRun: {
        id: 20,
        base_date: "2026-09-29",
        aggregation_started_on: "2021-09-29",
        frequency_started_on: "2025-09-29",
        status: "completed",
        customer_count: 120,
        excluded_count: 8,
        unmatched_count: 2,
        rank_counts: [
          {
            id: 1,
            code: "A",
            label: "Aランク",
            count: 25,
          },
          {
            id: 2,
            code: "B",
            label: "Bランク",
            count: 40,
          },
        ],
        started_by_staff: {
          id: 1,
          code: "00001",
          name: "管理者",
        },
        current: true,
        restorable: false,
      },
      isLoading: false,
      errorMessage: null,
    });

    render(
      <RfCalculationRunDetailDrawer
        open
        calculationRunId={20}
        onOpenChange={vi.fn()}
      />,
    );

    expect(mocks.useRfCalculationRunDetail).toHaveBeenCalledWith(20);
    expect(screen.getByText("2026/09/29")).toBeInTheDocument();
    expect(screen.getByText("計算完了")).toBeInTheDocument();
    expect(screen.getByText("対象 120名")).toBeInTheDocument();
    expect(screen.getByText("対象外 8名")).toBeInTheDocument();
    expect(screen.getByText("未分類 2名")).toBeInTheDocument();
    expect(screen.getByText("Aランク 25名")).toBeInTheDocument();
    expect(screen.getByText("Bランク 40名")).toBeInTheDocument();
    expect(screen.getByText("管理者")).toBeInTheDocument();
    expect(screen.getByText("現在適用中")).toBeInTheDocument();
    expect(screen.getByText("顧客別判定結果: 20")).toBeInTheDocument();
  });

  it("閉じている場合は履歴を取得しない", () => {
    mocks.useRfCalculationRunDetail.mockReturnValue({
      calculationRun: null,
      isLoading: false,
      errorMessage: null,
    });

    render(
      <RfCalculationRunDetailDrawer
        open={false}
        calculationRunId={20}
        onOpenChange={vi.fn()}
      />,
    );

    expect(mocks.useRfCalculationRunDetail).toHaveBeenCalledWith(null);
  });

  it("取得に失敗した場合はエラーを表示する", () => {
    mocks.useRfCalculationRunDetail.mockReturnValue({
      calculationRun: null,
      isLoading: false,
      errorMessage: "RF計算履歴の詳細を取得できませんでした。",
    });

    render(
      <RfCalculationRunDetailDrawer
        open
        calculationRunId={20}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "RF計算履歴の詳細を取得できませんでした。",
    );
  });

  it("ownerが計算完了済みの結果を適用する", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onApplied = vi.fn();

    mocks.useRfCalculationRunDetail.mockReturnValue({
      calculationRun: {
        id: 20,
        base_date: "2026-09-29",
        aggregation_started_on: "2021-09-29",
        frequency_started_on: "2025-09-29",
        status: "completed",
        customer_count: 120,
        excluded_count: 8,
        unmatched_count: 2,
        rank_counts: [],
        started_by_staff: null,
        current: false,
        restorable: false,
      },
      isLoading: false,
      errorMessage: null,
    });

    render(
      <RfCalculationRunDetailDrawer
        open
        calculationRunId={20}
        onOpenChange={onOpenChange}
        onApplied={onApplied}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "計算結果を適用",
      }),
    );

    const dialog = await screen.findByRole("alertdialog");

    await user.click(
      within(dialog).getByRole("button", {
        name: "計算結果を適用",
      }),
    );

    expect(mocks.activateRfCalculationRun).toHaveBeenCalledWith(20);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onApplied).toHaveBeenCalledOnce();
  });

  it("operatorには計算結果の適用操作を表示しない", () => {
    mocks.useAuth.mockReturnValue({
      staff: {
        staff_master: {
          role_code: "operator",
        },
      },
    });
    mocks.useRfCalculationRunDetail.mockReturnValue({
      calculationRun: {
        id: 20,
        base_date: "2026-09-29",
        aggregation_started_on: "2021-09-29",
        frequency_started_on: "2025-09-29",
        status: "completed",
        customer_count: 120,
        excluded_count: 8,
        unmatched_count: 2,
        rank_counts: [],
        started_by_staff: null,
        current: false,
        restorable: false,
      },
      isLoading: false,
      errorMessage: null,
    });

    render(
      <RfCalculationRunDetailDrawer
        open
        calculationRunId={20}
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: "計算結果を適用",
      }),
    ).not.toBeInTheDocument();
  });
});
