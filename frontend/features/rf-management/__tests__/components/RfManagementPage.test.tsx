import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RfManagementPage } from "../../components/RfManagementPage";

vi.mock("../../components/rule-sets/RfRuleSetsSection", () => ({
  RfRuleSetsSection: () => <div data-testid="rf-rule-sets-section" />,
}));

describe("RfManagementPage", () => {
  it("統一RFマスタ画面の見出しと説明を表示する", () => {
    render(<RfManagementPage />);

    expect(
      screen.getByRole("heading", {
        name: "統一RFマスタ",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("RFルールの設定と、RFランクの計算履歴を管理します。"),
    ).toBeInTheDocument();

    expect(screen.getByTestId("rf-rule-sets-section")).toBeInTheDocument();
  });
});
