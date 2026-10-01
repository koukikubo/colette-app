import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RfRuleSetBasicFormDialog } from "../../../components/rule-sets/RfRuleSetBasicFormDialog";
import type { RfRuleSet } from "../../../types";

const mocks = {
  onOpenChange: vi.fn(),
  onSubmit: vi.fn(),
};

const draftRuleSet: RfRuleSet = {
  id: 7,
  name: "既存RFルール",
  version: 2,
  aggregation_months: 60,
  frequency_window_months: 12,
  status: "draft",
  published_at: null,
  lock_version: 3,
  created_by_staff: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  recency_rules: [],
  frequency_rules: [],
  rank_mappings: [],
};

describe("RfRuleSetBasicFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onSubmit.mockResolvedValue(undefined);
  });

  it("基本設定を入力して下書きを作成する", async () => {
    const user = userEvent.setup();

    render(
      <RfRuleSetBasicFormDialog
        open
        mode="create"
        isSubmitting={false}
        errorMessage={null}
        onOpenChange={mocks.onOpenChange}
        onSubmit={mocks.onSubmit}
      />,
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "ルール名",
      }),
      "新しいRFルール",
    );

    await user.click(
      screen.getByRole("button", {
        name: "下書きを作成",
      }),
    );

    await waitFor(() => {
      expect(mocks.onSubmit).toHaveBeenCalledWith({
        name: "新しいRFルール",
        aggregation_months: 60,
        frequency_window_months: 12,
      });
    });
  });

  it("draftの現在値を編集フォームへ表示する", () => {
    render(
      <RfRuleSetBasicFormDialog
        open
        mode="edit"
        ruleSet={draftRuleSet}
        isSubmitting={false}
        errorMessage={null}
        onOpenChange={mocks.onOpenChange}
        onSubmit={mocks.onSubmit}
      />,
    );

    expect(
      screen.getByRole("textbox", {
        name: "ルール名",
      }),
    ).toHaveValue("既存RFルール");

    expect(
      screen.getByRole("spinbutton", {
        name: "全体の集計期間",
      }),
    ).toHaveValue(60);

    expect(
      screen.getByRole("spinbutton", {
        name: "来店回数の対象期間",
      }),
    ).toHaveValue(12);
  });

  it("来店回数の対象期間が全体の集計期間を超える場合は送信しない", async () => {
    const user = userEvent.setup();

    render(
      <RfRuleSetBasicFormDialog
        open
        mode="create"
        isSubmitting={false}
        errorMessage={null}
        onOpenChange={mocks.onOpenChange}
        onSubmit={mocks.onSubmit}
      />,
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "ルール名",
      }),
      "不正なRFルール",
    );

    const aggregationMonths = screen.getByRole("spinbutton", {
      name: "全体の集計期間",
    });

    const frequencyWindowMonths = screen.getByRole("spinbutton", {
      name: "来店回数の対象期間",
    });

    await user.clear(aggregationMonths);
    await user.type(aggregationMonths, "6");

    await user.clear(frequencyWindowMonths);
    await user.type(frequencyWindowMonths, "12");

    await user.click(
      screen.getByRole("button", {
        name: "下書きを作成",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "来店回数の対象期間は、全体の集計期間以下にしてください。",
    );

    expect(mocks.onSubmit).not.toHaveBeenCalled();
  });

  it("保存中は送信ボタンを無効にする", () => {
    render(
      <RfRuleSetBasicFormDialog
        open
        mode="edit"
        ruleSet={draftRuleSet}
        isSubmitting
        errorMessage={null}
        onOpenChange={mocks.onOpenChange}
        onSubmit={mocks.onSubmit}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "保存中...",
      }),
    ).toBeDisabled();
  });

  it("APIエラーをDialog内に表示する", () => {
    render(
      <RfRuleSetBasicFormDialog
        open
        mode="edit"
        ruleSet={draftRuleSet}
        isSubmitting={false}
        errorMessage="ほかの担当者によって更新されています。"
        onOpenChange={mocks.onOpenChange}
        onSubmit={mocks.onSubmit}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "ほかの担当者によって更新されています。",
    );
  });
});
