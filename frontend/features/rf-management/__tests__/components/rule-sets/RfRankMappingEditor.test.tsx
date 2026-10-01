import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RfRankMappingEditor } from "../../../components/rule-sets/RfRankMappingEditor";
import type { RfRankMappingInput } from "../../../types";

function TestEditor() {
  const [mappings, setMappings] = useState<RfRankMappingInput[]>([]);

  return (
    <>
      <RfRankMappingEditor
        recencyRules={[
          {
            code: "R1",
            label: "90日以内",
            min_days: 0,
            max_days: 90,
            position: 1,
          },
        ]}
        frequencyRules={[
          {
            code: "F1",
            label: "3回以上",
            min_visits: 3,
            max_visits: null,
            position: 1,
          },
        ]}
        mappings={mappings}
        rankOptions={[
          {
            id: 31,
            label: "Aランク",
          },
          {
            id: 32,
            label: "Bランク",
          },
        ]}
        onChange={setMappings}
      />

      <output data-testid="rank-mappings">{JSON.stringify(mappings)}</output>
    </>
  );
}

describe("RfRankMappingEditor", () => {
  it("RecencyとFrequencyの組み合わせにRFランクを設定する", async () => {
    const user = userEvent.setup();

    render(<TestEditor />);

    await user.click(
      screen.getByRole("combobox", {
        name: "90日以内・3回以上のRFランク",
      }),
    );

    await user.click(
      await screen.findByRole("option", {
        name: "Aランク",
      }),
    );

    expect(screen.getByTestId("rank-mappings")).toHaveTextContent(
      JSON.stringify([
        {
          recency_code: "R1",
          frequency_code: "F1",
          rf_rank_id: 31,
        },
      ]),
    );
  });

  it("条件がない場合は対応表を表示しない", () => {
    render(
      <RfRankMappingEditor
        recencyRules={[]}
        frequencyRules={[]}
        mappings={[]}
        rankOptions={[]}
        onChange={() => undefined}
      />,
    );

    expect(
      screen.getByText(
        "対応表を作成するには、Recency条件とFrequency条件が必要です。",
      ),
    ).toBeInTheDocument();
  });
});
