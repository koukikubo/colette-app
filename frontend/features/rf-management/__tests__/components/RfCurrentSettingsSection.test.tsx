import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RfCurrentSettingsSection } from "../../components/RfCurrentSettingsSection";

const mocks = vi.hoisted(() => ({
  useRfSettings: vi.fn(),
}));

vi.mock("../../hooks/useRfSettings", () => ({
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

    render(<RfCurrentSettingsSection />);

    expect(screen.getByText("RF設定を読み込んでいます。")).toBeInTheDocument();
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
        current_calculation_run: {
          base_date: "2026-09-29",
          status: "completed",
          customer_count: 120,
          excluded_count: 8,
          unmatched_count: 2,
        },
      },
      isLoading: false,
      errorMessage: null,
    });

    render(<RfCurrentSettingsSection />);

    expect(screen.getByText("標準RFルール")).toBeInTheDocument();
    expect(screen.getByText("バージョン 3")).toBeInTheDocument();
    expect(screen.getByText("12か月")).toBeInTheDocument();
    expect(screen.getByText("6か月")).toBeInTheDocument();
    expect(screen.getByText("2026/09/29")).toBeInTheDocument();
    expect(screen.getByText("120名")).toBeInTheDocument();
    expect(screen.getByText("対象外 8名")).toBeInTheDocument();
    expect(screen.getByText("未分類 2名")).toBeInTheDocument();
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
