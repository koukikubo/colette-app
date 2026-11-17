import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RfRuleSetPreviewTable } from "../../../components/rule-sets/RfRuleSetPreviewTable";

describe("RfRuleSetPreviewTable", () => {
  it("設定途中の条件とRFランクを表で表示する", () => {
    render(
      <RfRuleSetPreviewTable
        recencyRules={[
          {
            code: "R1",
            label: "90日以内",
            min_days: 0,
            max_days: null,
            position: 1,
          },
        ]}
        frequencyRules={[
          {
            code: "F1",
            label: "3回以上",
            min_visits: 0,
            max_visits: null,
            position: 1,
          },
        ]}
        mappings={[
          {
            recency_code: "R1",
            frequency_code: "F1",
            rf_rank_id: 31,
          },
        ]}
        rankOptions={[{ id: 31, label: "Aランク", display_color: "#059669" }]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "設定プレビュー" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "3回以上" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("rowheader", { name: "90日以内" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aランク")).toHaveStyle({
      color: "#059669",
    });
    expect(screen.queryByText("R1")).not.toBeInTheDocument();
    expect(screen.queryByText("F1")).not.toBeInTheDocument();
  });
});
