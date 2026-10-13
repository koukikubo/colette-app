import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RfDistributionTable } from "../../components/RfDistributionTable";
import { rfAnalysisFixture } from "../fixtures";

describe("RfDistributionTable", () => {
  it("RecencyとFrequencyごとの顧客分布を表示する", () => {
    render(
      <RfDistributionTable
        recencyRules={rfAnalysisFixture.recency_rules}
        frequencyRules={rfAnalysisFixture.frequency_rules}
        cells={rfAnalysisFixture.cells}
      />,
    );

    const table = screen.getByRole("table", {
      name: "最終来店期間と来店回数ごとのRFランク、顧客数、顧客割合",
    });

    expect(within(table).getByText("1回")).toBeInTheDocument();
    expect(within(table).getByText("2回以上")).toBeInTheDocument();
    expect(within(table).getByText("0〜90日")).toBeInTheDocument();
    expect(within(table).getByText("91日以上")).toBeInTheDocument();
  });

  it("各条件セルのランク・人数・割合を表示する", () => {
    render(
      <RfDistributionTable
        recencyRules={rfAnalysisFixture.recency_rules}
        frequencyRules={rfAnalysisFixture.frequency_rules}
        cells={rfAnalysisFixture.cells}
      />,
    );

    const table = screen.getByRole("table", {
      name: "最終来店期間と来店回数ごとのRFランク、顧客数、顧客割合",
    });

    const firstRow = within(table).getByRole("row", {
      name: /0〜90日/,
    });

    expect(within(firstRow).getAllByText("Aランク")).toHaveLength(2);
    expect(within(firstRow).getByText("15名")).toBeInTheDocument();
    expect(within(firstRow).getByText("15.00%")).toBeInTheDocument();
    expect(within(firstRow).getByText("25名")).toBeInTheDocument();
    expect(within(firstRow).getByText("25.00%")).toBeInTheDocument();

    const secondRow = within(table).getByRole("row", {
      name: /91日以上/,
    });

    expect(within(secondRow).getAllByText("Bランク")).toHaveLength(2);
    expect(within(secondRow).getByText("30名")).toBeInTheDocument();
    expect(within(secondRow).getByText("20名")).toBeInTheDocument();
  });

  it("対応する集計セルがない場合はダッシュを表示する", () => {
    render(
      <RfDistributionTable
        recencyRules={rfAnalysisFixture.recency_rules}
        frequencyRules={rfAnalysisFixture.frequency_rules}
        cells={rfAnalysisFixture.cells.slice(0, 3)}
      />,
    );

    const table = screen.getByRole("table", {
      name: "最終来店期間と来店回数ごとのRFランク、顧客数、顧客割合",
    });

    expect(within(table).getByText("—")).toBeInTheDocument();
  });
});
