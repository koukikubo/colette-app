import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RfRuleSetValidationResult } from "../../../components/rule-sets/RfRuleSetValidationResult";

describe("RfRuleSetValidationResult", () => {
  it("検証成功を表示する", () => {
    render(
      <RfRuleSetValidationResult
        validation={{
          valid: true,
          errors: [],
          warnings: [],
        }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("公開できる状態です");
  });

  it("エラーと注意事項を表示する", () => {
    render(
      <RfRuleSetValidationResult
        validation={{
          valid: false,
          errors: [
            {
              code: "mapping_missing",
              message: "RFランクが未設定の組み合わせがあります。",
            },
          ],
          warnings: [
            {
              code: "rank_unused",
              message: "使用されていないRFランクがあります。",
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("修正が必要です");

    expect(
      screen.getByText("RFランクが未設定の組み合わせがあります。"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("使用されていないRFランクがあります。"),
    ).toBeInTheDocument();
  });
});
