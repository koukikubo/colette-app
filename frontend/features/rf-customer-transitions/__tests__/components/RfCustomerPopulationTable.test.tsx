import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RfCustomerPopulationTable } from "../../components/RfCustomerPopulationTable";

import type {
  RfCustomerTransitionRow,
  RfCustomerTransitionTable,
} from "../../types/customer-transition";

function makeRow(
  overrides: Partial<RfCustomerTransitionRow> = {},
): RfCustomerTransitionRow {
  return {
    calculation_run_id: 20,
    previous_run_id: null,
    base_date: "2026-10-01",
    rank_counts: {},
    ranks: [],
    ranked_count: 0,
    unmatched_count: 0,
    excluded_count: 0,
    eligible_count: 0,
    total_count: 0,
    ...overrides,
  };
}

describe("RfCustomerPopulationTable", () => {
  it("各履歴の名前、色、人数と適用状態を表示する", () => {
    const table: RfCustomerTransitionTable = {
      current_calculation_run_id: 20,
      rows: [
        makeRow({
          previous_run_id: 10,
          ranks: [
            {
              id: 1,
              display_code: "00001",
              label: "現在のランク名",
              display_color: "#059669",
              position: 1,
              count: 12,
            },
          ],
          ranked_count: 12,
          unmatched_count: 2,
          excluded_count: 3,
          eligible_count: 14,
          total_count: 17,
        }),
        makeRow({
          calculation_run_id: 10,
          base_date: "2025-10-01",
          ranks: [
            {
              id: 1,
              display_code: "00001",
              label: "当時のランク名",
              display_color: "#FF0000",
              position: 1,
              count: 8,
            },
          ],
          ranked_count: 8,
          eligible_count: 8,
          total_count: 8,
        }),
      ],
    };

    render(<RfCustomerPopulationTable table={table} />);

    const currentRow = screen.getByRole("row", {
      name: /2026\/10\/01/,
    });
    const previousRow = screen.getByRole("row", {
      name: /2025\/10\/01/,
    });

    expect(within(currentRow).getByText("現在適用中")).toBeInTheDocument();
    expect(within(currentRow).getByText("12名")).toBeInTheDocument();
    expect(within(currentRow).getByText("14名")).toBeInTheDocument();
    expect(within(currentRow).getByText("2名")).toBeInTheDocument();
    expect(within(currentRow).getByText("3名")).toBeInTheDocument();
    expect(within(currentRow).getByText("17名")).toBeInTheDocument();

    expect(within(previousRow).getByText("当時のランク名")).toBeInTheDocument();
    expect(
      within(previousRow).queryByText("現在適用中"),
    ).not.toBeInTheDocument();

    const previousLabel = within(previousRow).getByText("当時のランク名");
    const colorDot = previousLabel.parentElement?.querySelector(
      '[aria-hidden="true"]',
    );

    expect(colorDot).toHaveStyle({ backgroundColor: "#FF0000" });
  });

  it("0人のランクと、その履歴に存在しないランクを区別する", () => {
    const table: RfCustomerTransitionTable = {
      current_calculation_run_id: 20,
      rows: [
        makeRow(),
        makeRow({
          calculation_run_id: 10,
          base_date: "2025-10-01",
          ranks: [
            {
              id: 2,
              display_code: "00002",
              label: "過去のランク",
              display_color: null,
              position: 2,
              count: 0,
            },
          ],
        }),
      ],
    };

    render(<RfCustomerPopulationTable table={table} />);

    const currentRow = screen.getByRole("row", {
      name: /2026\/10\/01/,
    });
    const previousRow = screen.getByRole("row", {
      name: /2025\/10\/01/,
    });

    expect(within(currentRow).getByText("—")).toBeInTheDocument();

    const rankCell = within(previousRow)
      .getByText("過去のランク")
      .closest("td");

    expect(rankCell).not.toBeNull();
    expect(within(rankCell!).getByText("0名")).toBeInTheDocument();
  });

  it("履歴がなければ案内を表示する", () => {
    render(
      <RfCustomerPopulationTable
        table={{
          current_calculation_run_id: null,
          rows: [],
        }}
      />,
    );

    expect(
      screen.getByText("適用済みのRF計算履歴がありません。"),
    ).toBeInTheDocument();

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
