import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";
import { RfRuleSetDraftEditor } from "../../../components/rule-sets/RfRuleSetDraftEditor";

import type { RfRuleSet } from "../../../types";

const mocks = vi.hoisted(() => ({
  updateRfRuleSet: vi.fn(),
  useRfRankOptions: vi.fn(),
  validateRfRuleSet: vi.fn(),
  publishRfRuleSet: vi.fn(),
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
}));

vi.mock("../../../hooks/useRfRankOptions", () => ({
  useRfRankOptions: mocks.useRfRankOptions,
}));

vi.mock("../../../api/rf-management-api", () => ({
  updateRfRuleSet: mocks.updateRfRuleSet,
  validateRfRuleSet: mocks.validateRfRuleSet,
  publishRfRuleSet: mocks.publishRfRuleSet,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.routerPush,
    refresh: mocks.routerRefresh,
  }),
}));

const ruleSet: RfRuleSet = {
  id: 7,
  name: "下書きRFルール",
  version: 2,
  aggregation_months: 60,
  frequency_window_months: 12,
  status: "draft",
  published_at: null,
  lock_version: 3,
  created_by_staff: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  recency_rules: [
    {
      id: 11,
      code: "R1",
      label: "すべての期間",
      min_days: 0,
      max_days: null,
      position: 1,
    },
  ],
  frequency_rules: [
    {
      id: 21,
      code: "F1",
      label: "0回以上",
      min_visits: 0,
      max_visits: null,
      position: 1,
    },
  ],
  rank_mappings: [
    {
      recency_rule_id: 11,
      frequency_rule_id: 21,
      rf_rank: {
        id: 31,
        code: "A",
        label: "Aランク",
      },
    },
  ],
};

describe("RfRuleSetDraftEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.updateRfRuleSet.mockResolvedValue({
      data: {
        rule_set: {
          ...ruleSet,
          lock_version: 4,
        },
      },
    });

    mocks.useRfRankOptions.mockReturnValue({
      options: [
        {
          id: 31,
          label: "Aランク",
        },
        {
          id: 32,
          label: "Bランク",
        },
      ],
      isLoading: false,
      errorMessage: null,
    });

    mocks.validateRfRuleSet.mockResolvedValue({
      data: {
        validation: {
          valid: true,
          errors: [],
          warnings: [],
        },
      },
    });

    mocks.publishRfRuleSet.mockResolvedValue({
      data: {
        rule_set: {
          ...ruleSet,
          status: "published",
          lock_version: 5,
          published_at: "2026-10-01T03:00:00Z",
        },
      },
    });
  });

  it("基本設定から最終来店の期間設定へ移動する", async () => {
    const user = userEvent.setup();

    render(<RfRuleSetDraftEditor ruleSet={ruleSet} />);

    expect(screen.getByText("Step 1：基本設定")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間へ",
      }),
    );

    expect(
      screen.getByText("Step 2：最終来店日からの期間"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "条件1の表示名",
      }),
    ).toHaveValue("すべての期間");
  });

  it("最終来店の期間をすべて削除するとその場で修正を案内する", async () => {
    const user = userEvent.setup();

    mocks.updateRfRuleSet.mockResolvedValue({
      data: {
        rule_set: {
          ...ruleSet,
          lock_version: 4,
          recency_rules: [],
          rank_mappings: [],
        },
      },
    });

    render(<RfRuleSetDraftEditor ruleSet={ruleSet} />);

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間へ",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "条件1を削除",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "最終来店日からの期間を1件以上追加してください。",
    );
    expect(
      screen.getByRole("button", {
        name: "最終来店日からの期間を保存",
      }),
    ).toBeDisabled();
    expect(mocks.updateRfRuleSet).not.toHaveBeenCalled();
  });

  it("競合した場合は再読み込みを案内する", async () => {
    const user = userEvent.setup();

    mocks.updateRfRuleSet.mockRejectedValue(
      new ApiClientError("更新内容が競合しました。", 409),
    );

    render(<RfRuleSetDraftEditor ruleSet={ruleSet} />);

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間へ",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間を保存",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ほかの担当者によって更新されています。画面を再読み込みして、もう一度操作してください。",
    );
  });

  it("未保存の変更がある状態で画面を移動すると破棄確認を表示する", async () => {
    const user = userEvent.setup();

    render(
      <>
        <a href="/dashboard">ダッシュボードへ移動</a>
        <RfRuleSetDraftEditor ruleSet={ruleSet} />
      </>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間へ",
      }),
    );

    const labelInput = screen.getByRole("textbox", {
      name: "条件1の表示名",
    });

    await user.clear(labelInput);
    await user.type(labelInput, "変更した条件");
    await user.click(
      screen.getByRole("link", {
        name: "ダッシュボードへ移動",
      }),
    );

    expect(
      screen.getByRole("alertdialog", {
        name: "入力内容を破棄しますか？",
      }),
    ).toHaveTextContent(
      "保存されていない変更があります。このまま移動すると、入力内容は失われます。",
    );
    expect(mocks.routerPush).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", {
        name: "破棄して移動",
      }),
    );

    expect(mocks.routerPush).toHaveBeenCalledWith("/dashboard");
  });

  it("来店回数の条件をすべて削除するとその場で修正を案内する", async () => {
    const user = userEvent.setup();

    render(<RfRuleSetDraftEditor ruleSet={ruleSet} />);

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間へ",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間を保存",
      }),
    );

    expect(
      await screen.findByText("Step 3：対象期間内の来店回数"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "条件1を削除",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "対象期間内の来店回数を1件以上追加してください。",
    );
    expect(
      screen.getByRole("button", {
        name: "来店回数の条件を保存",
      }),
    ).toBeDisabled();
  });

  it("RFランク対応表を変更して保存する", async () => {
    const user = userEvent.setup();

    render(<RfRuleSetDraftEditor ruleSet={ruleSet} />);

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間へ",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間を保存",
      }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "来店回数の条件を保存",
      }),
    );

    expect(
      await screen.findByText("Step 4：RFランク対応表"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("combobox", {
        name: "すべての期間・0回以上のRFランク",
      }),
    );

    await user.click(
      await screen.findByRole("option", {
        name: "Bランク",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "RFランク対応表を保存して検証",
      }),
    );

    await waitFor(() => {
      expect(mocks.updateRfRuleSet).toHaveBeenLastCalledWith(
        7,
        expect.objectContaining({
          lock_version: 4,
          rank_mappings: [
            {
              recency_code: "R1",
              frequency_code: "F1",
              rf_rank_id: 32,
            },
          ],
        }),
      );
    });

    expect(mocks.validateRfRuleSet).toHaveBeenCalledWith(7);

    expect(await screen.findByText("Step 5：検証結果")).toBeInTheDocument();

    expect(screen.getByRole("status")).toHaveTextContent("公開できる状態です");
  });

  it("検証エラーがある場合は修正内容を表示する", async () => {
    const user = userEvent.setup();

    mocks.validateRfRuleSet.mockResolvedValue({
      data: {
        validation: {
          valid: false,
          errors: [
            {
              code: "mapping_missing",
              message: "RFランクが未設定の組み合わせがあります。",
            },
          ],
          warnings: [],
        },
      },
    });

    render(<RfRuleSetDraftEditor ruleSet={ruleSet} />);

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間へ",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間を保存",
      }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "来店回数の条件を保存",
      }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "RFランク対応表を保存して検証",
      }),
    );

    expect(await screen.findByText("Step 5：検証結果")).toBeInTheDocument();

    expect(screen.getByRole("alert")).toHaveTextContent("修正が必要です");

    expect(
      screen.getByText("RFランクが未設定の組み合わせがあります。"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "公開確認へ",
      }),
    ).not.toBeInTheDocument();
  });

  it("検証済みのRFルールを公開して一覧へ戻る", async () => {
    const user = userEvent.setup();

    render(<RfRuleSetDraftEditor ruleSet={ruleSet} />);

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間へ",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "最終来店日からの期間を保存",
      }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "来店回数の条件を保存",
      }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "RFランク対応表を保存して検証",
      }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "公開確認へ",
      }),
    );

    expect(screen.getByText("Step 6：公開確認")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "このRFルールを公開",
      }),
    );

    await waitFor(() => {
      expect(mocks.publishRfRuleSet).toHaveBeenCalledWith(7, 4);
    });

    expect(mocks.routerPush).toHaveBeenCalledWith("/rf-management");
    expect(mocks.routerRefresh).toHaveBeenCalled();
  });
});
