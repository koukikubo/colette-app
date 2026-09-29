import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RfManagementPage } from "../../components/RfManagementPage";

describe("RfManagementPage", () => {
  it("統一RFマスタ画面の見出しと説明を表示する", () => {
    render(<RfManagementPage />);

    expect(
      screen.getByRole("heading", {
        name: "統一RFマスタ",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "公開中の判定ルールと、RFランクの計算履歴を確認します。",
      ),
    ).toBeInTheDocument();
  });
});
