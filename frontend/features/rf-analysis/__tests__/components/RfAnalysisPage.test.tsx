import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RfAnalysisPage } from "../../components/RfAnalysisPage";

vi.mock("../../components/RfAnalysisSection", () => ({
  RfAnalysisSection: () => (
    <section aria-label="RF分析結果">RF分析セクション</section>
  ),
}));

describe("RfAnalysisPage", () => {
  it("統一RF分析画面の見出しと説明を表示する", () => {
    render(<RfAnalysisPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "統一RF分析",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("現在の顧客構成と、前年同月からの変化を確認します。"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("region", {
        name: "RF分析結果",
      }),
    ).toHaveTextContent("RF分析セクション");
  });
});
