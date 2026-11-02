/**
 * 移動マトリクスの表示と、利用者によるセル選択を検証する。
 *
 * 割合の分母、クリック・キーボード操作、空状態、
 * 比較対象変更時の選択リセットを確認する。
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RfMovementMatrix } from "../../components/RfMovementMatrix";
import type {
  RfCustomerTransition,
  RfTransitionRank,
} from "../../types/customer-transition";

const rankA: RfTransitionRank = {
  id: 1,
  label: "Aランク",
  display_code: "00001",
  display_color: "#059669",
  position: 1,
};

const rankB: RfTransitionRank = {
  ...rankA,
  id: 2,
  label: "Bランク",
  display_code: "00002",
  position: 2,
};

// 開始時Bの12人のうち、3人がAへ上昇、9人がBを維持する。
const transitions: RfCustomerTransition[] = [
  {
    category: "up",
    from_state: "ranked",
    from_rank: rankB,
    to_state: "ranked",
    to_rank: rankA,
    count: 3,
  },
  {
    category: "unchanged",
    from_state: "ranked",
    from_rank: rankB,
    to_state: "ranked",
    to_rank: rankB,
    count: 9,
  },
];

describe("RfMovementMatrix", () => {
  it("移動人数と開始区分を分母にした割合を表示する", () => {
    render(<RfMovementMatrix transitions={transitions} />);

    const table = screen.getByRole("table", {
      name: "開始月から終了月へのRFランク移動",
    });

    expect(
      within(table).getByRole("button", {
        name: /BランクからAランクへ、3人.*25\.0%/,
      }),
    ).toHaveTextContent("↑ 上昇");

    expect(
      within(table).getByRole("button", {
        name: /BランクからBランクへ、9人.*75\.0%/,
      }),
    ).toHaveTextContent("＝ 維持");
  });

  it("セルをクリックすると移動内容を文章で説明する", async () => {
    const user = userEvent.setup();
    render(<RfMovementMatrix transitions={transitions} />);

    const cell = screen.getByRole("button", {
      name: /BランクからAランクへ/,
    });

    await user.click(cell);

    expect(cell).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "開始時点の「Bランク」12人のうち、3人",
    );
    expect(screen.getByRole("status")).toHaveTextContent("25.0%");
  });

  it("キーボードでもセルを選択できる", async () => {
    const user = userEvent.setup();
    render(<RfMovementMatrix transitions={transitions} />);

    const cell = screen.getByRole("button", {
      name: /BランクからAランクへ/,
    });

    // Tab移動で到達した状態を再現し、Enterで選択する。
    cell.focus();
    await user.keyboard("{Enter}");

    expect(cell).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("25.0%");
  });

  it("親から渡す比較キーが変わると選択をリセットする", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <RfMovementMatrix key="1:2" transitions={transitions} />,
    );

    await user.click(
      screen.getByRole("button", {
        name: /BランクからAランクへ/,
      }),
    );

    // 親画面が比較する計算IDに応じてkeyを変更する契約を確認する。
    rerender(<RfMovementMatrix key="1:3" transitions={transitions} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "人数のあるセルを選択すると",
    );
    expect(
      screen.getByRole("button", {
        name: /BランクからAランクへ/,
      }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("比較対象がなければ空状態を表示する", () => {
    render(<RfMovementMatrix transitions={[]} />);

    expect(screen.getByText("比較対象の顧客がいません。")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
