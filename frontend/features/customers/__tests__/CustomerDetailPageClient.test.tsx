import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import { CustomerDetailPageClient } from "../components/detail/CustomerDetailPageClient";
import type { Customer } from "../types";

const mocks = vi.hoisted(() => ({
  fetchCustomer: vi.fn(),
}));

vi.mock("../api/customer-api", () => ({
  fetchCustomer: mocks.fetchCustomer,
}));

vi.mock("../components/dialogs/CustomerFormDialog", () => ({
  CustomerFormDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">顧客編集ダイアログ</div> : null,
}));

function createCustomer(overrides: Partial<Customer> = {}): Customer {
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

    expect(await screen.findByRole("heading", { name: "山田 太郎" })).toBeInTheDocument();
    expect(screen.getByText("090-1234-5678")).toBeInTheDocument();
    expect(screen.getByText("100-0001")).toBeInTheDocument();
    expect(screen.getByText("常連のお客様")).toBeInTheDocument();
    expect(screen.getByText("店主")).toBeInTheDocument();
    expect(screen.getByText("担当者")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /顧客一覧へ戻る/ })).toHaveAttribute(
      "href",
      "/customers",
    );
    expect(mocks.fetchCustomer).toHaveBeenCalledWith(10);
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

    expect(await screen.findByText("顧客情報を表示できません")).toBeInTheDocument();
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
});
