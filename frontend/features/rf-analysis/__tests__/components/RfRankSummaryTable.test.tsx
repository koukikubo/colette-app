import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RfRankSummaryTable } from "../../components/RfRankSummaryTable";
import { rfAnalysisFixture } from "../fixtures";

describe("RfRankSummaryTable", () => {
  it("ランク別の顧客数と割合を表示する", () => {
    render(<RfRankSummaryTable ranks={rfAnalysisFixture.rank_distribution} />);

    const table = screen.getByRole("table", {
      name: "現在のRFランク別顧客数と顧客割合",
    });

    expect(within(table).getByText("Aランク")).toBeInTheDocument();
    expect(within(table).getByText("40名")).toBeInTheDocument();
    expect(within(table).getByText("40.00%")).toBeInTheDocument();

    expect(within(table).getByText("Bランク")).toBeInTheDocument();
    expect(within(table).getByText("50名")).toBeInTheDocument();
    expect(within(table).getByText("50.00%")).toBeInTheDocument();

    expect(within(table).getByText("Nランク")).toBeInTheDocument();
    expect(within(table).getByText("10名")).toBeInTheDocument();
    expect(within(table).getByText("10.00%")).toBeInTheDocument();
  });

  it("顧客数が0名のランクも表示する", () => {
    render(<RfRankSummaryTable ranks={rfAnalysisFixture.rank_distribution} />);

    const table = screen.getByRole("table", {
      name: "現在のRFランク別顧客数と顧客割合",
    });

    const rankC = within(table).getByText("Cランク");
    const row = rankC.closest("tr");

    expect(row).not.toBeNull();
    expect(within(row!).getByText("0名")).toBeInTheDocument();
    expect(within(row!).getByText("0.00%")).toBeInTheDocument();
  });

  it("ランクに設定された表示色を使用する", () => {
    render(<RfRankSummaryTable ranks={rfAnalysisFixture.rank_distribution} />);

    const rankLabel = screen.getByText("Aランク");
    const marker = rankLabel.parentElement?.querySelector(
      '[aria-hidden="true"]',
    );

    expect(marker).toHaveStyle({
      backgroundColor: "#059669",
    });
  });
});
