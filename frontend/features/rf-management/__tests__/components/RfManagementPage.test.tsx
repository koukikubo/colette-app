import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RfManagementPage } from "../../components/RfManagementPage";

vi.mock("../../components/rule-sets/RfRuleSetsSection", () => ({
  RfRuleSetsSection: ({
    onSettingsChanged,
  }: {
    onSettingsChanged: () => void;
  }) => (
    <button type="button" onClick={onSettingsChanged}>
      RFルールを更新
    </button>
  ),
}));

vi.mock("../../components/settings/RfCurrentSettingsSection", () => ({
  RfCurrentSettingsSection: ({ reloadKey }: { reloadKey: number }) => (
    <div data-testid="settings-reload-key">{reloadKey}</div>
  ),
}));

vi.mock("../../components/calculation/RfCalculationHistorySection", () => ({
  RfCalculationHistorySection: () => null,
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

    expect(
      screen.getByRole("button", { name: "RFルールを更新" }),
    ).toBeInTheDocument();
  });

  it("ルールの状態変更後に現在のRF設定を再取得させる", async () => {
    const user = userEvent.setup();

    render(<RfManagementPage />);

    expect(screen.getByTestId("settings-reload-key")).toHaveTextContent("0");

    await user.click(
      screen.getByRole("button", {
        name: "RFルールを更新",
      }),
    );

    expect(screen.getByTestId("settings-reload-key")).toHaveTextContent("1");
  });
});
