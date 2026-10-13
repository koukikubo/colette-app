import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RfAnalysisSection } from "../../components/RfAnalysisSection";
import { rfAnalysisFixture } from "../fixtures";

const mocks = vi.hoisted(() => ({
  useRfAnalysis: vi.fn(),
}));

vi.mock("../../hooks/useRfAnalysis", () => ({
  useRfAnalysis: mocks.useRfAnalysis,
}));

describe("RfAnalysisSection", () => {
  beforeEach(() => {
    mocks.useRfAnalysis.mockReset();
  });

  it("取得中の表示をする", () => {
    mocks.useRfAnalysis.mockReturnValue({
      analysis: null,
      isLoading: true,
      errorMessage: null,
    });

    render(<RfAnalysisSection reloadKey={3} />);

    expect(
      screen.getByRole("heading", {
        name: "統一RFランク表",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("RF分析結果を読み込んでいます。"),
    ).toBeInTheDocument();

    expect(mocks.useRfAnalysis).toHaveBeenCalledWith(3);
  });

  it("取得に失敗した場合はエラーを表示する", () => {
    mocks.useRfAnalysis.mockReturnValue({
      analysis: null,
      isLoading: false,
      errorMessage: "RF分析結果を取得できませんでした。",
    });

    render(<RfAnalysisSection />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "RF分析結果を取得できませんでした。",
    );
  });

  it("適用中の計算結果がない場合は案内を表示する", () => {
    mocks.useRfAnalysis.mockReturnValue({
      analysis: null,
      isLoading: false,
      errorMessage: null,
    });

    render(<RfAnalysisSection />);

    expect(
      screen.getByText(
        "適用中のRF計算結果がありません。RF計算を実行して結果を適用してください。",
      ),
    ).toBeInTheDocument();
  });

  it("計算月と集計概要を表示する", () => {
    mocks.useRfAnalysis.mockReturnValue({
      analysis: rfAnalysisFixture,
      isLoading: false,
      errorMessage: null,
    });

    render(<RfAnalysisSection />);

    expect(screen.getByText("2026年10月集計")).toBeInTheDocument();
    expect(screen.getByText("計算基準日：2026/10/10")).toBeInTheDocument();
    expect(screen.getByText("計算対象")).toBeInTheDocument();
    expect(screen.getByText("100名")).toBeInTheDocument();
    expect(screen.getByText("計算対象外")).toBeInTheDocument();
    expect(screen.getByText("8名")).toBeInTheDocument();
    expect(screen.getByText("未分類")).toBeInTheDocument();
    expect(screen.getAllByText("0名").length).toBeGreaterThanOrEqual(1);
  });

  it("ランク別人数・条件表・1年前比較を表示する", () => {
    mocks.useRfAnalysis.mockReturnValue({
      analysis: rfAnalysisFixture,
      isLoading: false,
      errorMessage: null,
    });

    render(<RfAnalysisSection />);

    expect(
      screen.getByRole("table", {
        name: "現在のRFランク別顧客数と顧客割合",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("table", {
        name: "最終来店期間と来店回数ごとのRFランク、顧客数、顧客割合",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("table", {
        name: "現在と1年前のRFランク別顧客数および割合の比較",
      }),
    ).toBeInTheDocument();
  });
});
