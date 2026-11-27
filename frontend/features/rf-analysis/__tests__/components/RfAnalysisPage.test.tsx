import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RfAnalysisPage } from "../../components/RfAnalysisPage";

vi.mock("../../components/RfAnalysisSection", () => ({
  RfAnalysisSection: () => (
    <section aria-label="RF分析結果">RF分析セクション</section>
  ),
}));

describe("RfAnalysisPage", () => {
  it("重複する大見出しを出さず読み上げ見出しと分析結果を保持する", () => {
    render(<RfAnalysisPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "統一RFランク表",
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("sr-only");

    expect(
      screen.getByRole("region", {
        name: "RF分析結果",
      }),
    ).toHaveTextContent("RF分析セクション");
  });
});
