import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RfFrequencyRulesEditor } from "../../../components/rule-sets/RfFrequencyRulesEditor";
import type { RfFrequencyRuleInput } from "../../../types";

function TestEditor() {
  const [rules, setRules] = useState<RfFrequencyRuleInput[]>([]);

  return (
    <>
      <RfFrequencyRulesEditor rules={rules} onChange={setRules} />
      <output data-testid="frequency-rules">{JSON.stringify(rules)}</output>
    </>
  );
}

describe("RfFrequencyRulesEditor", () => {
  it("来店回数の条件を追加して入力できる", async () => {
    const user = userEvent.setup();

    render(<TestEditor />);

    expect(
      screen.getByText("対象期間内の来店回数がまだ登録されていません。"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "来店回数の条件を追加",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "条件1の表示名",
      }),
      "3回以上",
    );

    const minimum = screen.getByRole("spinbutton", {
      name: "条件1の最小来店回数",
    });

    await user.clear(minimum);
    await user.type(minimum, "3");

    expect(screen.getByTestId("frequency-rules")).toHaveTextContent(
      '"code":"F1"',
    );
    expect(screen.getByTestId("frequency-rules")).toHaveTextContent(
      '"label":"3回以上"',
    );
    expect(screen.getByTestId("frequency-rules")).toHaveTextContent(
      '"min_visits":3',
    );
  });
});
