import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RfCurrentSettingsSection } from "../../../components/settings/RfCurrentSettingsSection";

const mocks = vi.hoisted(() => ({
  useRfSettings: vi.fn(),
}));

vi.mock("../../../hooks/useRfSettings", () => ({
  useRfSettings: mocks.useRfSettings,
}));

describe("RfCurrentSettingsSection", () => {
  beforeEach(() => {
    mocks.useRfSettings.mockReset();
  });

  it("取得中の表示をする", () => {
    mocks.useRfSettings.mockReturnValue({
      settings: null,
      isLoading: true,
      errorMessage: null,
    });

    render(<RfCurrentSettingsSection reloadKey={3} />);

    expect(screen.getByText("RF設定を読み込んでいます。")).toBeInTheDocument();
    expect(mocks.useRfSettings).toHaveBeenCalledWith(3);
  });

  it("公開中のルールと現在の計算結果を表示する", () => {
    mocks.useRfSettings.mockReturnValue({
      settings: {
        published_rule_set: {
          name: "標準RFルール",
          version: 3,
          aggregation_months: 12,
          frequency_window_months: 6,
        },
        applied_rule_set: {
          id: 3,
          name: "標準RFルール",
          version: 3,
          aggregation_months: 12,
          frequency_window_months: 6,
          recency_rules: [],
          frequency_rules: [],
          rank_mappings: [],
        },
        current_calculation_run: {
          base_date: "2026-09-29",
          status: "completed",
          customer_count: 120,
          excluded_count: 8,
          unmatched_count: 2,
          rank_counts: [
            {
              id: 31,
              code: "A",
              label: "Aランク",
              display_color: "#059669",
              count: 70,
            },
            {
              id: 32,
              code: "B",
              label: "Bランク",
              display_color: "#0D9488",
              count: 40,
            },
          ],
        },
      },
      isLoading: false,
      errorMessage: null,
    });

    render(<RfCurrentSettingsSection />);

    expect(screen.getAllByText("標準RFルール")).toHaveLength(2);
    expect(screen.getAllByText("バージョン 3")).toHaveLength(1);
    expect(screen.getByText("12か月")).toBeInTheDocument();
    expect(screen.getByText("2026/09/29")).toBeInTheDocument();
    expect(screen.getByText("120名")).toBeInTheDocument();
    expect(screen.getByText("8名")).toBeInTheDocument();
    expect(screen.getByText("2名")).toBeInTheDocument();
    expect(screen.getByText("現在のランク別人数")).toBeInTheDocument();
    expect(screen.getByText("Aランク")).toBeInTheDocument();
    expect(screen.getByText("70名")).toBeInTheDocument();
    expect(screen.getByText("Bランク")).toBeInTheDocument();
    expect(screen.getByText("40名")).toBeInTheDocument();
  });

  it("取得に失敗した場合はエラーを表示する", () => {
    mocks.useRfSettings.mockReturnValue({
      settings: null,
      isLoading: false,
      errorMessage: "RF設定を取得できませんでした。",
    });

    render(<RfCurrentSettingsSection />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "RF設定を取得できませんでした。",
    );
  });
});
