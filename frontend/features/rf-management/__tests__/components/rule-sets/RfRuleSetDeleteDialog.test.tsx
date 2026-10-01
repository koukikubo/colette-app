import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RfRuleSetDeleteDialog } from "../../../components/rule-sets/RfRuleSetDeleteDialog";

describe("RfRuleSetDeleteDialog", () => {
  it("削除対象を表示して確認処理を実行する", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <RfRuleSetDeleteDialog
        open
        ruleSetName="下書きRFルール"
        isSubmitting={false}
        errorMessage={null}
        onOpenChange={() => undefined}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByRole("alertdialog", {
        name: "下書きのRFルールを削除しますか？",
      }),
    ).toHaveTextContent("下書きRFルール");

    await user.click(
      screen.getByRole("button", {
        name: "削除する",
      }),
    );

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("削除エラーを表示する", () => {
    render(
      <RfRuleSetDeleteDialog
        open
        ruleSetName="下書きRFルール"
        isSubmitting={false}
        errorMessage="RFルールを削除できませんでした。"
        onOpenChange={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "RFルールを削除できませんでした。",
    );
  });
});
