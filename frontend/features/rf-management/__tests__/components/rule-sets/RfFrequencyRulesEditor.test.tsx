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
  it("Frequency条件を追加して入力できる", async () => {
    const user = userEvent.setup();

    render(<TestEditor />);

    expect(
      screen.getByText("Frequency条件がまだ登録されていません。"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Frequency条件を追加",
      }),
    );

    expect(screen.getByText("内部コード：F1")).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", {
        name: "F1の表示名",
      }),
      "3回以上",
    );

    const minimum = screen.getByRole("spinbutton", {
      name: "F1の最小来店回数",
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
