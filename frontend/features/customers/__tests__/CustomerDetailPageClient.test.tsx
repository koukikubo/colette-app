import { act, screen, waitFor, within } from "@testing-library/react";
import { renderWithRole, renderWithOwner as render } from "@/test-utils/auth";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import { CustomerDetailPageClient } from "../components/detail/CustomerDetailPageClient";
import type { CustomerDetail } from "../types";

const mocks = vi.hoisted(() => ({
  fetchCustomer: vi.fn(),
}));

vi.mock("../api/customer-api", () => ({
  fetchCustomer: mocks.fetchCustomer,
}));

vi.mock("../components/dialogs/CustomerFormDialog", () => ({
  CustomerFormDialog: ({
    open,
    onCompleted,
    onOpenChange,
  }: {
    open: boolean;
    onCompleted: () => Promise<void>;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div role="dialog">
        顧客編集ダイアログ
        <button
          onClick={async () => {
            await onCompleted();
            onOpenChange(false);
          }}
        >
          保存完了を通知
        </button>
      </div>
    ) : null,
}));

// 独自項目のHTTP検証は専用コンポーネントテストで行う。
vi.mock("../components/detail/CustomerDetailFields", () => ({
  CustomerDetailFields: () => (
    <section aria-label="詳細情報">店舗独自項目</section>
  ),
}));
beforeEach(() => {
  window.history.replaceState(null, "", "/customers/10?tab=history");
});

vi.mock("../components/detail/CustomerReservationHistory", () => ({
  CustomerReservationHistory: ({ customerId }: { customerId: number }) => (
    <section aria-label="予約履歴">顧客{customerId}の予約履歴</section>
  ),
}));

function createCustomer(
  overrides: Partial<CustomerDetail> = {},
): CustomerDetail {
  return {
    id: 10,
    customer_kind: "individual",
    name: "山田 太郎",
    kana: "ヤマダ タロウ",
    postal_code: "1000001",
    address: "東京都千代田区千代田1-1",
    phone_number: "09012345678",
    email: "taro@example.com",
    birthday: "1990-01-02",
    customer_rank_id: null,
    customer_rank: null,
    company_name: null,
    company_name_kana: null,
    company_postal_code: null,
    company_address: null,
    company_phone_number: null,
    company_email: null,
    memo: "常連のお客様",
    hidden: false,
    hidden_at: null,
    lock_version: 2,
    created_by_staff: { id: 1, code: "001", name: "店主" },
    updated_by_staff: { id: 2, code: "002", name: "担当者" },
    rf_rank_state: "no_applied_run",
    current_rf_rank: null,
    rf_rank_basis: null,
    created_at: "2026-09-01T10:00:00+09:00",
    updated_at: "2026-09-02T11:30:00+09:00",
    ...overrides,
  };
}

describe("CustomerDetailPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("取得した個人顧客の詳細を表示する", async () => {
    mocks.fetchCustomer.mockResolvedValue({
      data: { customer: createCustomer() },
    });

    render(<CustomerDetailPageClient customerId={10} />);

    expect(
      await screen.findByRole("heading", { name: "山田 太郎" }),
    ).toBeInTheDocument();
    expect(screen.getByText("090-1234-5678")).toBeInTheDocument();
    expect(screen.getByText("100-0001")).toBeInTheDocument();
    expect(screen.getByText("常連のお客様")).toBeInTheDocument();
    expect(screen.getByText("店主")).toBeInTheDocument();
    expect(screen.getByText("担当者")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /顧客一覧へ戻る/ }),
    ).toHaveAttribute("href", "/customers");
    expect(mocks.fetchCustomer).toHaveBeenCalledWith(10);
    expect(
      screen.getByRole("region", {
        name: "予約履歴",
      }),
    ).toHaveTextContent("顧客10の予約履歴");
  });

  it("法人顧客の場合は法人情報を表示する", async () => {
    mocks.fetchCustomer.mockResolvedValue({
      data: {
        customer: createCustomer({
          customer_kind: "corporate",
          company_name: "株式会社コレット",
          company_phone_number: "0312345678",
          company_postal_code: "1500001",
          company_address: "東京都渋谷区",
        }),
      },
    });

    render(<CustomerDetailPageClient customerId={10} />);

    expect(await screen.findByText("法人情報")).toBeInTheDocument();
    expect(screen.getByText("株式会社コレット")).toBeInTheDocument();
    expect(screen.getByText("03-1234-5678")).toBeInTheDocument();
    expect(screen.getByText("150-0001")).toBeInTheDocument();
  });

  it("編集ボタンを押すと編集ダイアログを開く", async () => {
    const user = userEvent.setup();
    mocks.fetchCustomer.mockResolvedValue({
      data: { customer: createCustomer() },
    });

    render(<CustomerDetailPageClient customerId={10} />);

    await user.click(
      await screen.findByRole("button", { name: /顧客情報を編集/ }),
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("顧客編集ダイアログ");
  });

  it("404の場合は顧客が見つからないことを表示する", async () => {
    mocks.fetchCustomer.mockRejectedValue(new ApiClientError("Not Found", 404));

    render(<CustomerDetailPageClient customerId={999} />);

    expect(
      await screen.findByText("顧客情報を表示できません"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("指定された顧客が見つかりませんでした。"),
    ).toBeInTheDocument();
  });

  it("予期しない取得エラーでは共通メッセージを表示する", async () => {
    mocks.fetchCustomer.mockRejectedValue(new Error("network error"));

    render(<CustomerDetailPageClient customerId={10} />);

    expect(
      await screen.findByText(
        "顧客情報の取得中に予期しないエラーが発生しました。",
      ),
    ).toBeInTheDocument();
  });

  it("顧客ランクと現在のRFランク、その判定根拠を表示する", async () => {
    mocks.fetchCustomer.mockResolvedValue({
      data: {
        customer: createCustomer({
          customer_rank_id: 8,
          customer_rank: {
            id: 8,
            code: "VIP",
            label: "VIP顧客",
          },
          rf_rank_state: "ranked",
          current_rf_rank: {
            id: 20,
            display_code: "00020",
            label: "Aランク",
            display_color: "#059669",
          },
          rf_rank_basis: {
            calculation_run_id: 5,
            base_date: "2026-09-26",
            recency_days: 20,
            frequency_count: 3,
            last_visit_on: "2026-09-06",
            exclusion_reason: null,
          },
        }),
      },
    });

    render(<CustomerDetailPageClient customerId={10} />);

    expect(
      await screen.findByRole("heading", {
        name: "顧客ランク",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("VIP顧客")).toBeInTheDocument();
    expect(screen.getByText("Aランク")).toBeInTheDocument();
    expect(screen.getByText("2026/09/26")).toBeInTheDocument();
    expect(screen.getByText("2026/09/06")).toBeInTheDocument();
    expect(screen.getByText("20日")).toBeInTheDocument();
    expect(screen.getByText("3回")).toBeInTheDocument();

    const rankLabel = screen.getByText("Aランク");
    const rankContainer = rankLabel.parentElement!;
    const colorIndicator = rankContainer.querySelector('[aria-hidden="true"]');

    expect(colorIndicator).toHaveStyle({
      backgroundColor: "#059669",
    });
    expect(screen.getByText("（00020）")).toBeInTheDocument();
  });

  it("RFランクの色が未設定の場合は灰色で表示する", async () => {
    mocks.fetchCustomer.mockResolvedValue({
      data: {
        customer: createCustomer({
          customer_rank_id: 8,
          customer_rank: {
            id: 8,
            code: "VIP",
            label: "VIP顧客",
          },
          rf_rank_state: "ranked",
          current_rf_rank: {
            id: 20,
            display_code: "00020",
            label: "Aランク",
            display_color: null,
          },
          rf_rank_basis: {
            calculation_run_id: 5,
            base_date: "2026-09-26",
            recency_days: 20,
            frequency_count: 3,
            last_visit_on: "2026-09-06",
            exclusion_reason: null,
          },
        }),
      },
    });

    render(<CustomerDetailPageClient customerId={10} />);

    expect(
      await screen.findByRole("heading", {
        name: "顧客ランク",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("VIP顧客")).toBeInTheDocument();
    expect(screen.getByText("Aランク")).toBeInTheDocument();
    expect(screen.getByText("2026/09/26")).toBeInTheDocument();
    expect(screen.getByText("2026/09/06")).toBeInTheDocument();
    expect(screen.getByText("20日")).toBeInTheDocument();
    expect(screen.getByText("3回")).toBeInTheDocument();

    const rankLabel = screen.getByText("Aランク");
    const rankContainer = rankLabel.parentElement!;
    const colorIndicator = rankContainer.querySelector('[aria-hidden="true"]');

    expect(colorIndicator).toHaveStyle({
      backgroundColor: "#64748B",
    });
    expect(screen.getByText("（00020）")).toBeInTheDocument();
  });

  it("現在適用中のRF計算結果がない場合は未計算と表示する", async () => {
    mocks.fetchCustomer.mockResolvedValue({
      data: {
        customer: createCustomer({
          current_rf_rank: null,
          rf_rank_basis: null,
        }),
      },
    });

    render(<CustomerDetailPageClient customerId={10} />);

    expect(
      await screen.findByRole("heading", {
        name: "顧客ランク",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("適用履歴なし")).toBeInTheDocument();

    expect(
      screen.getByText("現在適用中のRF計算履歴はありません。"),
    ).toBeInTheDocument();
  });

  it("手動の顧客ランクが設定されている場合はRF計算対象外と表示する", async () => {
    mocks.fetchCustomer.mockResolvedValue({
      data: {
        customer: createCustomer({
          customer_rank_id: 8,
          customer_rank: {
            id: 8,
            code: "VIP",
            label: "VIP顧客",
          },
          rf_rank_state: "excluded",
          current_rf_rank: null,
          rf_rank_basis: {
            calculation_run_id: 5,
            base_date: "2026-09-26",
            recency_days: null,
            frequency_count: 0,
            last_visit_on: null,
            exclusion_reason: "manual_customer_rank",
          },
        }),
      },
    });

    render(<CustomerDetailPageClient customerId={10} />);

    expect(
      await screen.findByRole("heading", {
        name: "顧客ランク",
      }),
    ).toBeInTheDocument();

    const exclusionAlert = screen.getByRole("alert");

    expect(
      within(exclusionAlert).getByText("RF計算対象外"),
    ).toBeInTheDocument();

    expect(
      within(exclusionAlert).getByText(
        "手動の顧客ランクが設定されているため、RF計算の対象外です。",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("VIP顧客")).toBeInTheDocument();
  });
});

it("背景取得中と失敗時にも予約履歴の同じ要素を保持する", async () => {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  const customer = createCustomer();
  let finish!: (value: unknown) => void;
  mocks.fetchCustomer
    .mockReset()
    .mockResolvedValueOnce({ data: { customer } })
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockRejectedValueOnce(new Error("offline"));
  render(<CustomerDetailPageClient customerId={10} />);
  const history = await screen.findByRole("region", { name: "予約履歴" });
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });
  await waitFor(() => expect(mocks.fetchCustomer).toHaveBeenCalledTimes(2));
  expect(screen.getByRole("region", { name: "予約履歴" })).toBe(history);
  await act(async () => {
    finish({ data: { customer } });
  });
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });
  await screen.findByRole("alert");
  expect(screen.getByRole("region", { name: "予約履歴" })).toBe(history);
});

it.each(["成功", "失敗"])(
  "保存後の再取得より古い背景GETの%s応答を採用しない",
  async (outcome) => {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const original = createCustomer();
    const updated = createCustomer({ name: "保存後の顧客", lock_version: 3 });
    let finish!: (value: unknown) => void;
    let fail!: (reason: unknown) => void;
    mocks.fetchCustomer
      .mockReset()
      .mockResolvedValueOnce({ data: { customer: original } })
      .mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            finish = resolve;
            fail = reject;
          }),
      )
      .mockResolvedValueOnce({ data: { customer: updated } });
    const user = userEvent.setup();
    render(<CustomerDetailPageClient customerId={10} />);
    await screen.findByRole("heading", { name: "山田 太郎" });
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    await waitFor(() => expect(mocks.fetchCustomer).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: /顧客情報を編集/ }));
    await user.click(screen.getByRole("button", { name: "保存完了を通知" }));
    await screen.findByRole("heading", { name: "保存後の顧客" });
    await act(async () => {
      if (outcome === "成功") finish({ data: { customer: original } });
      else fail(new Error("old GET failed"));
    });
    expect(
      screen.getByRole("heading", { name: "保存後の顧客" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  },
);

it.each([true, false])(
  "RF内訳からの戻り先と名称を取得成功=%sでも維持する",
  async (success) => {
    const target = "/rf-customers?run_id=2&rf_rank_id=22&page=3&per_page=1";
    window.history.replaceState(
      null,
      "",
      `/customers/10?return_to=${encodeURIComponent(target)}`,
    );
    mocks.fetchCustomer.mockReset();
    if (success)
      mocks.fetchCustomer.mockResolvedValue({
        data: { customer: createCustomer() },
      });
    else
      mocks.fetchCustomer.mockRejectedValue(
        new ApiClientError("取得失敗", 503),
      );
    try {
      render(<CustomerDetailPageClient customerId={10} />);
      expect(
        await screen.findByRole("link", { name: "RFの顧客内訳に戻る" }),
      ).toHaveAttribute("href", target);
    } finally {
      window.history.replaceState(null, "", "/");
    }
  },
);

it("ルール未一致を計算対象外や未計算と表示しない", async () => {
  mocks.fetchCustomer.mockResolvedValue({
    data: {
      customer: createCustomer({
        rf_rank_state: "unmatched",
        rf_rank_basis: {
          calculation_run_id: 1,
          base_date: "2026-11-24",
          recency_days: 10,
          frequency_count: 1,
          last_visit_on: "2026-11-14",
          exclusion_reason: "no_matching_rule",
        },
      }),
    },
  });
  render(<CustomerDetailPageClient customerId={10} />);
  expect(await screen.findByText("ルール未一致")).toBeInTheDocument();
  expect(screen.queryByText("RF計算対象外")).not.toBeInTheDocument();
  expect(screen.queryByText("未計算")).not.toBeInTheDocument();
});

it("閲覧専用ユーザーは顧客を確認できるが編集できない", async () => {
  mocks.fetchCustomer.mockResolvedValue({
    data: { customer: createCustomer() },
  });
  renderWithRole(<CustomerDetailPageClient customerId={10} />, "viewer");
  expect(
    await screen.findByRole("heading", { name: "山田 太郎" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /編集/ }),
  ).not.toBeInTheDocument();
});

it("初回取得の失敗から再読み込みで回復する", async () => {
  const user = userEvent.setup();
  mocks.fetchCustomer
    .mockRejectedValueOnce(new Error("network"))
    .mockResolvedValueOnce({ data: { customer: createCustomer() } });
  render(<CustomerDetailPageClient customerId={10} />);
  await user.click(await screen.findByRole("button", { name: "再読み込み" }));
  expect(
    await screen.findByRole("heading", { name: "山田 太郎" }),
  ).toBeInTheDocument();
});

it.each([
  ["not_calculated", "未計算"],
  ["no_visit", "来店履歴なし：Nランク"],
] as const)("RF分類%sを一覧と同じ意味で表示する", async (state, label) => {
  mocks.fetchCustomer.mockResolvedValue({
    data: {
      customer: createCustomer({
        rf_rank_state: state,
        current_rf_rank:
          state === "no_visit"
            ? {
                id: 3,
                display_code: "N",
                label: "Nランク",
                display_color: "#64748B",
              }
            : null,
      }),
    },
  });
  render(<CustomerDetailPageClient customerId={10} />);
  expect(await screen.findByText(label)).toBeInTheDocument();
});

it("4タブをURLに保持し、上部の顧客識別を切り替えない", async () => {
  window.history.replaceState(
    null,
    "",
    "/customers/10?return_to=%2Fcustomers%3Fquery%3Dtest&tab=memo",
  );
  mocks.fetchCustomer.mockResolvedValue({
    data: { customer: createCustomer() },
  });
  const user = userEvent.setup();
  render(<CustomerDetailPageClient customerId={10} />);
  await screen.findByRole("heading", { name: "山田 太郎" });
  expect(screen.getByRole("tab", { name: "スタッフメモ" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await user.click(screen.getByRole("tab", { name: "予約・来店履歴" }));
  expect(new URLSearchParams(window.location.search).get("tab")).toBe(
    "history",
  );
  expect(new URLSearchParams(window.location.search).get("return_to")).toBe(
    "/customers?query=test",
  );
  expect(
    screen.getByRole("heading", { name: "山田 太郎" }),
  ).toBeInTheDocument();
});
