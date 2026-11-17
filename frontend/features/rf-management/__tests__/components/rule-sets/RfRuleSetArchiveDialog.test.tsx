import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RfRuleSetArchiveDialog } from "../../../components/rule-sets/RfRuleSetArchiveDialog";

describe("RfRuleSetArchiveDialog", () => {
  it("対象ルールを表示してアーカイブ確認を実行する", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <RfRuleSetArchiveDialog
        open
        ruleSetName="公開中RFルール"
        isSubmitting={false}
        errorMessage={null}
        onOpenChange={() => undefined}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByRole("alertdialog", {
        name: "公開中のRFルールをアーカイブしますか？",
      }),
    ).toHaveTextContent("公開中RFルール");

    await user.click(
      screen.getByRole("button", {
        name: "アーカイブする",
      }),
    );

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("APIエラーを表示する", () => {
    render(
      <RfRuleSetArchiveDialog
        open
        ruleSetName="公開中RFルール"
        isSubmitting={false}
        errorMessage="RFルールをアーカイブできませんでした。"
        onOpenChange={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "RFルールをアーカイブできませんでした。",
    );
  });
});
