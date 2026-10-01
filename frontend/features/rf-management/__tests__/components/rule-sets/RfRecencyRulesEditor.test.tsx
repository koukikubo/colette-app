import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RfRecencyRulesEditor } from "../../../components/rule-sets/RfRecencyRulesEditor";
import type { RfRecencyRuleInput } from "../../../types";

function TestEditor({
  initialRules = [],
}: {
  initialRules?: RfRecencyRuleInput[];
}) {
  const [rules, setRules] = useState<RfRecencyRuleInput[]>(initialRules);

  return (
    <>
      <RfRecencyRulesEditor rules={rules} onChange={setRules} />

      <output data-testid="recency-rules">{JSON.stringify(rules)}</output>
    </>
  );
}

describe("RfRecencyRulesEditor", () => {
  it("最終来店日からの期間を追加して入力できる", async () => {
    const user = userEvent.setup();

    render(<TestEditor />);

    expect(
      screen.getByText("最終来店日からの期間がまだ登録されていません。"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間を追加",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "条件1の表示名",
      }),
      "90日以内",
    );

    const maximum = screen.getByRole("spinbutton", {
      name: "条件1の終了日数",
    });

    await user.type(maximum, "90");

    expect(screen.getByTestId("recency-rules")).toHaveTextContent(
      '"code":"R1"',
    );
    expect(screen.getByTestId("recency-rules")).toHaveTextContent(
      '"label":"90日以内"',
    );
    expect(screen.getByTestId("recency-rules")).toHaveTextContent(
      '"max_days":90',
    );
  });

  it("条件を並び替えるとpositionを振り直す", async () => {
    const user = userEvent.setup();

    render(
      <TestEditor
        initialRules={[
          {
            code: "R1",
            label: "90日以内",
            min_days: 0,
            max_days: 90,
            position: 1,
          },
          {
            code: "R2",
            label: "91日以上",
            min_days: 91,
            max_days: null,
            position: 2,
          },
        ]}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "条件2を上へ移動",
      }),
    );

    const output = screen.getByTestId("recency-rules");

    expect(output.textContent).toBe(
      JSON.stringify([
        {
          code: "R2",
          label: "91日以上",
          min_days: 91,
          max_days: null,
          position: 1,
        },
        {
          code: "R1",
          label: "90日以内",
          min_days: 0,
          max_days: 90,
          position: 2,
        },
      ]),
    );
  });

  it("条件を削除するとpositionを振り直す", async () => {
    const user = userEvent.setup();

    render(
      <TestEditor
        initialRules={[
          {
            code: "R1",
            label: "90日以内",
            min_days: 0,
            max_days: 90,
            position: 1,
          },
          {
            code: "R2",
            label: "91日以上",
            min_days: 91,
            max_days: null,
            position: 2,
          },
        ]}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "条件1を削除",
      }),
    );

    expect(screen.queryByText("内部コード：R1")).not.toBeInTheDocument();

    expect(screen.getByTestId("recency-rules")).toHaveTextContent(
      '"code":"R2"',
    );
    expect(screen.getByTestId("recency-rules")).toHaveTextContent(
      '"position":1',
    );
  });
});
