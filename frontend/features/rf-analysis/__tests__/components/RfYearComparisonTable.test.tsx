import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RfYearComparisonTable } from "../../components/RfYearComparisonTable";
import { rfAnalysisFixture } from "../fixtures";

describe("RfYearComparisonTable", () => {
  it("現在と1年前のランク別人数を表示する", () => {
    render(<RfYearComparisonTable comparison={rfAnalysisFixture.comparison} />);

    expect(screen.getByText("比較対象：2025/10/10")).toBeInTheDocument();

    const table = screen.getByRole("table", {
      name: "現在と1年前のRFランク別顧客数および割合の比較",
    });

    const rankARow = within(table).getByRole("row", {
      name: /Aランク/,
    });

    expect(within(rankARow).getByText("35名")).toBeInTheDocument();
    expect(within(rankARow).getByText("40名")).toBeInTheDocument();
    expect(within(rankARow).getByText("+5名")).toBeInTheDocument();
    expect(within(rankARow).getByText("+5pt")).toBeInTheDocument();

    const rankBRow = within(table).getByRole("row", {
      name: /Bランク/,
    });

    expect(within(rankBRow).getByText("55名")).toBeInTheDocument();
    expect(within(rankBRow).getByText("50名")).toBeInTheDocument();
    expect(within(rankBRow).getByText("-5名")).toBeInTheDocument();
    expect(within(rankBRow).getByText("-5pt")).toBeInTheDocument();
  });

  it("比較対象がない場合は案内を表示する", () => {
    render(<RfYearComparisonTable comparison={null} />);

    expect(
      screen.getByText("1年前に比較できる適用済みのRF計算結果がありません。"),
    ).toBeInTheDocument();

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
