import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/api-client";
import { RfCustomerTransitionPage } from "../../components/RfCustomerTransitionPage";
import type { RfMonthComparisonResponse } from "../../types/customer-transition";

const mocks = vi.hoisted(() => ({ fetchRfMonthComparison: vi.fn() }));
vi.mock("../../api/customer-transition-api", () => mocks);
const response: RfMonthComparisonResponse = {
  data: {
    start_month: "2026-07",
    end_month: "2026-09",
    provisional: false,
    start_run: { id: 1, base_date: "2026-07-31", rule_set_id: 1 },
    end_run: { id: 3, base_date: "2026-09-20", rule_set_id: 1 },
    movement: {
      comparison_run_id: 1,
      counts: {
        up: 0,
        down: 0,
        unchanged: 1,
        same_position: 0,
        added: 0,
        removed: 0,
        excluded: 0,
        unmatched: 0,
        no_visit: 0,
      },
      transitions: [
        {
          category: "unchanged",
          from_state: "ranked",
          to_state: "ranked",
          count: 1,
          from_rank: {
            id: 1,
            label: "A",
            display_code: "00001",
            display_color: "#ffffff",
            position: 1,
          },
          to_rank: {
            id: 1,
            label: "A",
            display_code: "00001",
            display_color: "#ffffff",
            position: 1,
          },
        },
      ],
    },
  },
};
function months(start = "2026-07", end = "2026-09") {
  fireEvent.change(screen.getByLabelText("開始月"), {
    target: { value: start },
  });
  fireEvent.change(screen.getByLabelText("終了月"), { target: { value: end } });
}
beforeEach(() => mocks.fetchRfMonthComparison.mockReset());
describe("RfCustomerTransitionPage", () => {
  it("年月指定で比較し、ヒントから計算基準日を確認できる", async () => {
    const user = userEvent.setup();

    mocks.fetchRfMonthComparison.mockResolvedValue(response);
    render(<RfCustomerTransitionPage />);

    expect(screen.getByRole("button", { name: "比較する" })).toBeDisabled();
    expect(mocks.fetchRfMonthComparison).not.toHaveBeenCalled();

    months();
    await user.click(screen.getByRole("button", { name: "比較する" }));

    expect(await screen.findByRole("table")).toHaveTextContent("維持");

    // 対象期間は画面上に表示し、詳細な基準日はヒントで確認する。
    expect(screen.getByText("対象期間")).toBeInTheDocument();

    const hint = screen.getByRole("button", {
      name: "対象期間と計算基準日について",
    });

    await user.hover(hint);

    // Tooltipは遅延して開くため、findByRoleで表示を待つ。
    // 内容全体で検証し、Radixが読み上げ用に複製する文章との重複を避ける。
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("開始：2026-07-31");
    expect(tooltip).toHaveTextContent("終了：2026-09-20");

    expect(mocks.fetchRfMonthComparison).toHaveBeenCalledWith(
      "2026-07",
      "2026-09",
      expect.any(AbortSignal),
    );
  });

  it("rejects reversed months without a request", async () => {
    render(<RfCustomerTransitionPage />);
    months("2026-09", "2026-07");
    await userEvent.click(screen.getByRole("button", { name: "比較する" }));
    expect(screen.getByRole("alert")).toHaveTextContent("開始月は終了月以前");
    expect(mocks.fetchRfMonthComparison).not.toHaveBeenCalled();
  });
  it("shows API details for missing history and supports retry", async () => {
    mocks.fetchRfMonthComparison
      .mockRejectedValueOnce(
        new ApiClientError("取得できません", 422, [
          "2026-07に計算履歴がありません",
        ]),
      )
      .mockResolvedValueOnce(response);
    render(<RfCustomerTransitionPage />);
    months();
    await userEvent.click(screen.getByRole("button", { name: "比較する" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "2026-07に計算履歴がありません",
    );
    await userEvent.click(screen.getByRole("button", { name: "比較する" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("discards a stale response when the month changes", async () => {
    let resolve!: (value: RfMonthComparisonResponse) => void;
    mocks.fetchRfMonthComparison.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<RfCustomerTransitionPage />);
    months();
    await userEvent.click(screen.getByRole("button", { name: "比較する" }));
    expect(screen.getByRole("status")).toBeInTheDocument();
    months("2026-08");
    expect(mocks.fetchRfMonthComparison.mock.calls[0][2].aborted).toBe(true);
    await act(async () => resolve(response));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("暫定バッジと空状態を表示し、ヒントから暫定理由を確認できる", async () => {
    const user = userEvent.setup();

    mocks.fetchRfMonthComparison.mockResolvedValue({
      data: {
        ...response.data,
        provisional: true,
        movement: {
          ...response.data.movement,
          // 空状態のテストなので、概要の人数も0に揃える。
          counts: {
            up: 0,
            down: 0,
            unchanged: 0,
            same_position: 0,
            added: 0,
            removed: 0,
            excluded: 0,
            unmatched: 0,
            no_visit: 0,
          },
          transitions: [],
        },
      },
    });

    render(<RfCustomerTransitionPage />);
    months();

    await user.click(screen.getByRole("button", { name: "比較する" }));

    // 暫定であることは、ヒントを開かなくても分かるようにする。
    expect(await screen.findByText("暫定")).toBeInTheDocument();
    expect(screen.getByText("比較対象の顧客がいません。")).toBeInTheDocument();

    // 詳細な説明は、対象期間のヒントを開いて確認する。
    await user.hover(
      screen.getByRole("button", {
        name: "対象期間と計算基準日について",
      }),
    );

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("当月を含むため暫定結果です。");
    expect(tooltip).toHaveTextContent(
      "今日までの適用済み計算を使用しています。",
    );
  });
});
