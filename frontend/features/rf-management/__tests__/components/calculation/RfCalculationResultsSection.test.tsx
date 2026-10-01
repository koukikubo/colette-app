import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RfCalculationResultsSection } from "../../../components/calculation/RfCalculationResultsSection";

const mocks = vi.hoisted(() => ({
  useRfCalculationResults: vi.fn(),
}));

vi.mock("../../../hooks/useRfCalculationResults", () => ({
  useRfCalculationResults: mocks.useRfCalculationResults,
}));

describe("RfCalculationResultsSection", () => {
  beforeEach(() => {
    mocks.useRfCalculationResults.mockReset();
  });

  it("顧客別のRF判定結果を表示する", () => {
    mocks.useRfCalculationResults.mockReturnValue({
      results: [
        {
          id: 100,
          customer: {
            id: 30,
            name: "山田 太郎",
          },
          previous_rf_rank: {
            id: 2,
            code: "B",
            label: "Bランク",
          },
          rf_rank: {
            id: 1,
            code: "A",
            label: "Aランク",
          },
          changed: true,
          recency_days: 30,
          frequency_count: 5,
          last_visit_on: "2026-08-30",
          previous_exclusion_reason: null,
          exclusion_reason: null,
        },
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_pages: 1,
        total_count: 1,
      },
      isLoading: false,
      errorMessage: null,
    });

    render(<RfCalculationResultsSection calculationRunId={20} />);

    expect(mocks.useRfCalculationResults).toHaveBeenCalledWith({
      calculationRunId: 20,
      page: 1,
      perPage: 20,
    });

    expect(screen.getByText("山田 太郎")).toBeInTheDocument();
    expect(screen.getByText("Bランク → Aランク")).toBeInTheDocument();
    expect(screen.getByText("最終来店から30日")).toBeInTheDocument();
    expect(screen.getByText("来店回数5回")).toBeInTheDocument();
    expect(screen.getByText("2026/08/30")).toBeInTheDocument();
  });

  it("対象外の顧客には対象外理由を表示する", () => {
    mocks.useRfCalculationResults.mockReturnValue({
      results: [
        {
          id: 101,
          customer: {
            id: 31,
            name: "佐藤 花子",
          },
          previous_rf_rank: null,
          rf_rank: null,
          changed: false,
          recency_days: null,
          frequency_count: null,
          last_visit_on: null,
          previous_exclusion_reason: null,
          exclusion_reason: "手動顧客ランク対象",
        },
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_pages: 1,
        total_count: 1,
      },
      isLoading: false,
      errorMessage: null,
    });

    render(<RfCalculationResultsSection calculationRunId={20} />);

    expect(screen.getByText("対象外")).toBeInTheDocument();
    expect(screen.getByText("手動顧客ランク対象")).toBeInTheDocument();
  });

  it("次へを押すと次ページを取得する", () => {
    mocks.useRfCalculationResults.mockImplementation(
      ({
        page,
      }: {
        calculationRunId: number;
        page: number;
        perPage: number;
      }) => ({
        results: [],
        pagination: {
          current_page: page,
          per_page: 20,
          total_pages: 2,
          total_count: 21,
        },
        isLoading: false,
        errorMessage: null,
      }),
    );

    render(<RfCalculationResultsSection calculationRunId={20} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "次へ",
      }),
    );

    expect(mocks.useRfCalculationResults).toHaveBeenLastCalledWith({
      calculationRunId: 20,
      page: 2,
      perPage: 20,
    });
  });
});
