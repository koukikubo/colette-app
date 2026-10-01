import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";
import { RfRuleSetDraftEditor } from "../../../components/rule-sets/RfRuleSetDraftEditor";

import type { RfRuleSet } from "../../../types";

const mocks = vi.hoisted(() => ({
  updateRfRuleSet: vi.fn(),
}));

vi.mock("../../../api/rf-management-api", () => ({
  updateRfRuleSet: mocks.updateRfRuleSet,
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
      label: "90日以内",
      min_days: 0,
      max_days: 90,
      position: 1,
    },
  ],
  frequency_rules: [
    {
      id: 21,
      code: "F1",
      label: "1回以上",
      min_visits: 1,
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
  });

  it("基本設定からRecency条件へ移動する", async () => {
    const user = userEvent.setup();

    render(<RfRuleSetDraftEditor ruleSet={ruleSet} />);

    expect(screen.getByText("Step 1：基本設定")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Recency条件へ",
      }),
    );

    expect(screen.getByText("Step 2：Recency条件")).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "R1の表示名",
      }),
    ).toHaveValue("90日以内");
  });

  it("削除したR条件を対応表から取り除いて保存する", async () => {
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
        name: "Recency条件へ",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "R1を削除",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Recency条件を保存",
      }),
    );

    await waitFor(() => {
      expect(mocks.updateRfRuleSet).toHaveBeenCalledWith(7, {
        name: "下書きRFルール",
        aggregation_months: 60,
        frequency_window_months: 12,
        lock_version: 3,
        recency_rules: [],
        frequency_rules: [
          {
            code: "F1",
            label: "1回以上",
            min_visits: 1,
            max_visits: null,
            position: 1,
          },
        ],
        rank_mappings: [],
      });
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Recency条件を保存しました。",
    );
  });

  it("競合した場合は再読み込みを案内する", async () => {
    const user = userEvent.setup();

    mocks.updateRfRuleSet.mockRejectedValue(
      new ApiClientError("更新内容が競合しました。", 409),
    );

    render(<RfRuleSetDraftEditor ruleSet={ruleSet} />);

    await user.click(
      screen.getByRole("button", {
        name: "Recency条件へ",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Recency条件を保存",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ほかの担当者によって更新されています。画面を再読み込みして、もう一度操作してください。",
    );
  });

  it("Frequency条件を削除すると対応表から取り除いて保存する", async () => {
    const user = userEvent.setup();

    render(<RfRuleSetDraftEditor ruleSet={ruleSet} />);

    await user.click(
      screen.getByRole("button", {
        name: "Recency条件へ",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Recency条件を保存",
      }),
    );

    expect(
      await screen.findByText("Step 3：Frequency条件"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "F1を削除",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Frequency条件を保存",
      }),
    );

    await waitFor(() => {
      expect(mocks.updateRfRuleSet).toHaveBeenLastCalledWith(7, {
        name: "下書きRFルール",
        aggregation_months: 60,
        frequency_window_months: 12,
        lock_version: 4,
        recency_rules: [
          {
            code: "R1",
            label: "90日以内",
            min_days: 0,
            max_days: 90,
            position: 1,
          },
        ],
        frequency_rules: [],
        rank_mappings: [],
      });
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Frequency条件を保存しました。",
    );
  });
});
