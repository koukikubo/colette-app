import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import { RfRuleSetsSection } from "../../../components/rule-sets/RfRuleSetsSection";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useRfRuleSets: vi.fn(),
  createRfRuleSet: vi.fn(),
  fetchRfRuleSet: vi.fn(),
  updateRfRuleSet: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/features/staff-auth/hooks/use-auth", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("../../../hooks/useRfRuleSets", () => ({
  useRfRuleSets: mocks.useRfRuleSets,
}));

vi.mock("../../../api/rf-management-api", () => ({
  createRfRuleSet: mocks.createRfRuleSet,
  fetchRfRuleSet: mocks.fetchRfRuleSet,
  updateRfRuleSet: mocks.updateRfRuleSet,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock("../../../components/rule-sets/RfRuleSetBasicFormDialog", () => ({
  RfRuleSetBasicFormDialog: ({
    open,
    mode,
    errorMessage,
    onSubmit,
  }: {
    open: boolean;
    mode: "create" | "edit";
    errorMessage: string | null;
    onSubmit: (values: {
      name: string;
      aggregation_months: number;
      frequency_window_months: number;
    }) => Promise<void>;
  }) => {
    if (!open) return null;

    const values =
      mode === "create"
        ? {
            name: "新しいRFルール",
            aggregation_months: 60,
            frequency_window_months: 12,
          }
        : {
            name: "編集後のRFルール",
            aggregation_months: 36,
            frequency_window_months: 6,
          };

    return (
      <div role="dialog" aria-label="RFルール基本設定">
        <p>{mode === "create" ? "新規作成" : "基本設定編集"}</p>

        {errorMessage && <p role="alert">{errorMessage}</p>}

        <button type="button" onClick={() => void onSubmit(values)}>
          フォームを送信
        </button>
      </div>
    );
  },
}));

const draftRuleSetSummary = {
  id: 7,
  name: "下書きRFルール",
  version: 2,
  aggregation_months: 60,
  frequency_window_months: 12,
  status: "draft",
  published_at: null,
  created_by_staff: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
};

const publishedRuleSetSummary = {
  ...draftRuleSetSummary,
  id: 8,
  name: "公開中RFルール",
  version: 1,
  status: "published",
  published_at: "2026-09-30T00:00:00Z",
};

const draftRuleSet = {
  ...draftRuleSetSummary,
  lock_version: 3,
  recency_rules: [],
  frequency_rules: [],
  rank_mappings: [],
};

function mockOwner() {
  mocks.useAuth.mockReturnValue({
    staff: {
      staff_master: {
        role_code: "owner",
      },
    },
  });
}

function mockOperator() {
  mocks.useAuth.mockReturnValue({
    staff: {
      staff_master: {
        role_code: "operator",
      },
    },
  });
}

function mockRuleSetList() {
  mocks.useRfRuleSets.mockReturnValue({
    ruleSets: [draftRuleSetSummary, publishedRuleSetSummary],
    pagination: {
      current_page: 1,
      per_page: 10,
      total_pages: 1,
      total_count: 2,
    },
    isLoading: false,
    errorMessage: null,
  });
}

describe("RfRuleSetsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockOwner();
    mockRuleSetList();

    mocks.createRfRuleSet.mockResolvedValue({
      data: {
        rule_set: draftRuleSet,
      },
    });

    mocks.fetchRfRuleSet.mockResolvedValue({
      data: {
        rule_set: draftRuleSet,
      },
    });

    mocks.updateRfRuleSet.mockResolvedValue({
      data: {
        rule_set: draftRuleSet,
      },
    });
  });

  it("RFルール一覧と状態を表示する", () => {
    render(<RfRuleSetsSection />);

    expect(screen.getByText("下書きRFルール")).toBeInTheDocument();
    expect(screen.getByText("公開中RFルール")).toBeInTheDocument();

    expect(screen.getByText("下書き")).toBeInTheDocument();
    expect(screen.getByText("公開中")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "新しいルールを作成",
      }),
    ).toBeInTheDocument();

    // draftだけ編集でき、公開済みルールには編集ボタンを表示しない。
    expect(
      screen.getAllByRole("button", {
        name: "基本設定を編集",
      }),
    ).toHaveLength(1);

    expect(
      screen.getByRole("link", {
        name: "条件と対応表を設定",
      }),
    ).toHaveAttribute("href", "/rf-management/7/edit");
  });

  it("operatorには作成・編集ボタンを表示しない", () => {
    mockOperator();

    render(<RfRuleSetsSection />);

    expect(screen.getByText("下書きRFルール")).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "新しいルールを作成",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "基本設定を編集",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: "条件と対応表を設定",
      }),
    ).not.toBeInTheDocument();
  });

  it("ownerが新しいdraftルールを作成できる", async () => {
    const user = userEvent.setup();

    render(<RfRuleSetsSection />);

    await user.click(
      screen.getByRole("button", {
        name: "新しいルールを作成",
      }),
    );

    expect(
      screen.getByRole("dialog", {
        name: "RFルール基本設定",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "フォームを送信",
      }),
    );

    await waitFor(() => {
      expect(mocks.createRfRuleSet).toHaveBeenCalledWith({
        name: "新しいRFルール",
        aggregation_months: 60,
        frequency_window_months: 12,
        recency_rules: [],
        frequency_rules: [],
        rank_mappings: [],
      });
    });

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/rf-management/7/edit");
    });
  });

  it("draftの詳細を取得して基本設定を更新する", async () => {
    const user = userEvent.setup();

    render(<RfRuleSetsSection />);

    await user.click(
      screen.getByRole("button", {
        name: "基本設定を編集",
      }),
    );

    await waitFor(() => {
      expect(mocks.fetchRfRuleSet).toHaveBeenCalledWith(7);
    });

    expect(
      await screen.findByRole("dialog", {
        name: "RFルール基本設定",
      }),
    ).toHaveTextContent("基本設定編集");

    await user.click(
      screen.getByRole("button", {
        name: "フォームを送信",
      }),
    );

    await waitFor(() => {
      expect(mocks.updateRfRuleSet).toHaveBeenCalledWith(7, {
        name: "編集後のRFルール",
        aggregation_months: 36,
        frequency_window_months: 6,
        lock_version: 3,
        recency_rules: [],
        frequency_rules: [],
        rank_mappings: [],
      });
    });
  });

  it("競合した場合は再読み込み案内を表示する", async () => {
    const user = userEvent.setup();

    mocks.updateRfRuleSet.mockRejectedValue(
      new ApiClientError("更新内容が競合しました。", 409),
    );

    render(<RfRuleSetsSection />);

    await user.click(
      screen.getByRole("button", {
        name: "基本設定を編集",
      }),
    );

    await screen.findByRole("dialog", {
      name: "RFルール基本設定",
    });

    await user.click(
      screen.getByRole("button", {
        name: "フォームを送信",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ほかの担当者によって更新されています。一覧を再読み込みして、もう一度操作してください。",
    );
  });

  it("一覧取得に失敗した場合はエラーを表示する", () => {
    mocks.useRfRuleSets.mockReturnValue({
      ruleSets: [],
      pagination: null,
      isLoading: false,
      errorMessage: "RFルールを取得できませんでした。",
    });

    render(<RfRuleSetsSection />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "RFルールを取得できませんでした。",
    );
  });
});
