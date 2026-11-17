import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RfRuleSetEditorPage } from "../../../components/rule-sets/RfRuleSetEditorPage";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useRfRuleSetDetail: vi.fn(),
}));

vi.mock("@/features/staff-auth/hooks/use-auth", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("../../../hooks/useRfRuleSetDetail", () => ({
  useRfRuleSetDetail: mocks.useRfRuleSetDetail,
}));

vi.mock("../../../components/rule-sets/RfRuleSetDraftEditor", () => ({
  RfRuleSetDraftEditor: ({ ruleSet }: { ruleSet: { id: number } }) => (
    <div data-testid="rf-rule-set-draft-editor">編集対象ID: {ruleSet.id}</div>
  ),
}));

const draftRuleSet = {
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
  recency_rules: [],
  frequency_rules: [],
  rank_mappings: [],
};

describe("RfRuleSetEditorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useAuth.mockReturnValue({
      status: "authenticated",
      staff: {
        staff_master: {
          role_code: "owner",
        },
      },
    });

    mocks.useRfRuleSetDetail.mockReturnValue({
      ruleSet: draftRuleSet,
      isLoading: false,
      errorMessage: null,
    });
  });

  it("ownerに6段階の編集手順と基本設定を表示する", () => {
    render(<RfRuleSetEditorPage ruleSetId={7} />);

    expect(
      screen.getByRole("heading", {
        name: "下書きRFルール",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("バージョン 2")).toBeInTheDocument();
    expect(screen.getByTestId("rf-rule-set-draft-editor")).toHaveTextContent(
      "編集対象ID: 7",
    );
    expect(mocks.useRfRuleSetDetail).toHaveBeenCalledWith({
      ruleSetId: 7,
    });
  });

  it("operatorには編集画面を表示しない", () => {
    mocks.useAuth.mockReturnValue({
      status: "authenticated",
      staff: {
        staff_master: {
          role_code: "operator",
        },
      },
    });

    render(<RfRuleSetEditorPage ruleSetId={7} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "RFルールを編集できるのはオーナーのみです。",
    );

    expect(mocks.useRfRuleSetDetail).toHaveBeenCalledWith({
      ruleSetId: null,
    });
  });

  it("公開済みルールは編集できない", () => {
    mocks.useRfRuleSetDetail.mockReturnValue({
      ruleSet: {
        ...draftRuleSet,
        status: "published",
      },
      isLoading: false,
      errorMessage: null,
    });

    render(<RfRuleSetEditorPage ruleSetId={7} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "公開中またはアーカイブ済みのRFルールは編集できません。",
    );
  });

  it("取得エラーを表示する", () => {
    mocks.useRfRuleSetDetail.mockReturnValue({
      ruleSet: null,
      isLoading: false,
      errorMessage: "RFルールが見つかりません。",
    });

    render(<RfRuleSetEditorPage ruleSetId={999} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "RFルールが見つかりません。",
    );
  });
});
