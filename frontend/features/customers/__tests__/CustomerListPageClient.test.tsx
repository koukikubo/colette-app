import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CustomerListPageClient } from "../components/list/CustomerListPageClient";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  fetchCustomers: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  hideCustomer: vi.fn(),
  restoreCustomer: vi.fn(),
}));

vi.mock("../api/customer-api", () => ({
  fetchCustomers: mocks.fetchCustomers,
  createCustomer: mocks.createCustomer,
  updateCustomer: mocks.updateCustomer,
  hideCustomer: mocks.hideCustomer,
  restoreCustomer: mocks.restoreCustomer,
}));

describe("CustomerListPageClient", () => {
  it("取得した顧客を一覧に表示する", async () => {
    mocks.fetchCustomers.mockResolvedValue({
      status: "success",
      data: {
        customers: [
          {
            id: 1,
            customer_kind: "individual",
            name: "山田 太郎",
            kana: "ヤマダ タロウ",
            postal_code: "1000001",
            address: "東京都千代田区",
            phone_number: "09012345678",
            email: "taro@example.com",
            birthday: "1990-01-01",
            company_name: null,
            company_name_kana: null,
            company_postal_code: null,
            company_address: null,
            company_phone_number: null,
            company_email: null,
            memo: null,
            hidden: false,
            hidden_at: null,
            lock_version: 0,
            created_by_staff: null,
            updated_by_staff: null,
            created_at: "2026-09-06T00:00:00Z",
            updated_at: "2026-09-06T00:00:00Z",
          },
        ],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 1,
        },
      },
    });

    render(<CustomerListPageClient />);

    expect(await screen.findByText("山田 太郎")).toBeInTheDocument();
    expect(screen.getByText("ヤマダ タロウ")).toBeInTheDocument();
    expect(screen.getByText("090-1234-5678")).toBeInTheDocument();
    expect(screen.getByText("taro@example.com")).toBeInTheDocument();
    expect(screen.getByText("個人")).toBeInTheDocument();
    expect(screen.getByText("表示中")).toBeInTheDocument();

    expect(mocks.fetchCustomers).toHaveBeenCalledWith({
      visibility: "visible",
      customer_kind: undefined,
      query: undefined,
      page: 1,
      per_page: 20,
    });

    expect(
      screen.getByRole("link", {
        name: "山田 太郎の詳細を表示",
      }),
    ).toHaveAttribute("href", "/customers/1");
  });

  it("顧客が登録されていない場合、空表示メッセージを表示する", async () => {
    mocks.fetchCustomers.mockResolvedValue({
      status: "success",
      data: {
        customers: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 0,
        },
      },
    });

    render(<CustomerListPageClient />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "顧客が登録されていません",
    );

    expect(
      screen.getByText("顧客が登録されると、ここに一覧表示されます。"),
    ).toBeInTheDocument();

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("顧客一覧の取得に失敗すると、エラーを表示する", async () => {
    mocks.fetchCustomers.mockRejectedValue(new Error("API通信エラー"));

    render(<CustomerListPageClient />);

    expect(
      await screen.findByText("顧客一覧を取得できませんでした"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("顧客一覧の取得中に予期しないエラーが発生しました。"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "再読み込み",
      }),
    ).toBeInTheDocument();

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("再読み込みを押すと、顧客一覧を再取得して表示する", async () => {
    const user = userEvent.setup();

    mocks.fetchCustomers
      .mockRejectedValueOnce(new Error("API通信エラー"))
      .mockResolvedValueOnce({
        status: "success",
        data: {
          customers: [
            {
              id: 1,
              customer_kind: "individual",
              name: "山田 太郎",
              kana: "ヤマダ タロウ",
              postal_code: "1000001",
              address: "東京都千代田区",
              phone_number: "09012345678",
              email: "taro@example.com",
              birthday: "1990-01-01",
              company_name: null,
              company_name_kana: null,
              company_postal_code: null,
              company_address: null,
              company_phone_number: null,
              company_email: null,
              memo: null,
              hidden: false,
              hidden_at: null,
              lock_version: 0,
              created_by_staff: null,
              updated_by_staff: null,
              created_at: "2026-09-06T00:00:00Z",
              updated_at: "2026-09-06T00:00:00Z",
            },
          ],
          pagination: {
            current_page: 1,
            per_page: 20,
            total_pages: 1,
            total_count: 1,
          },
        },
      });

    render(<CustomerListPageClient />);

    expect(
      await screen.findByText("顧客一覧を取得できませんでした"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "再読み込み",
      }),
    );

    expect(await screen.findByText("山田 太郎")).toBeInTheDocument();

    expect(
      screen.queryByText("顧客一覧を取得できませんでした"),
    ).not.toBeInTheDocument();

    expect(mocks.fetchCustomers).toHaveBeenCalledTimes(2);
  });
  it("キーワードで顧客を検索できる", async () => {
    const user = userEvent.setup();

    mocks.fetchCustomers
      .mockResolvedValueOnce({
        status: "success",
        data: {
          customers: [],
          pagination: {
            current_page: 1,
            per_page: 20,
            total_pages: 1,
            total_count: 0,
          },
        },
      })
      .mockResolvedValueOnce({
        status: "success",
        data: {
          customers: [
            {
              id: 1,
              customer_kind: "individual",
              name: "山田 太郎",
              kana: "ヤマダ タロウ",
              postal_code: null,
              address: null,
              phone_number: "09012345678",
              email: "taro@example.com",
              birthday: null,
              company_name: null,
              company_name_kana: null,
              company_postal_code: null,
              company_address: null,
              company_phone_number: null,
              company_email: null,
              memo: null,
              hidden: false,
              hidden_at: null,
              lock_version: 0,
              created_by_staff: null,
              updated_by_staff: null,
              created_at: "2026-09-06T00:00:00Z",
              updated_at: "2026-09-06T00:00:00Z",
            },
          ],
          pagination: {
            current_page: 1,
            per_page: 20,
            total_pages: 1,
            total_count: 1,
          },
        },
      });

    render(<CustomerListPageClient />);

    expect(
      await screen.findByText("顧客が登録されていません"),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("searchbox", {
        name: "顧客検索キーワード",
      }),
      "山田",
    );

    await user.click(
      screen.getByRole("button", {
        name: "検索",
      }),
    );

    expect(await screen.findByText("山田 太郎")).toBeInTheDocument();

    expect(mocks.fetchCustomers).toHaveBeenNthCalledWith(1, {
      visibility: "visible",
      customer_kind: undefined,
      query: undefined,
      page: 1,
      per_page: 20,
    });

    expect(mocks.fetchCustomers).toHaveBeenNthCalledWith(2, {
      visibility: "visible",
      customer_kind: undefined,
      query: "山田",
      page: 1,
      per_page: 20,
    });
  });

  it("検索キーワードの前後の空白を除去してEnterキーで検索できる", async () => {
    const user = userEvent.setup();

    mocks.fetchCustomers.mockResolvedValue({
      status: "success",
      data: {
        customers: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 0,
        },
      },
    });

    render(<CustomerListPageClient />);

    expect(
      await screen.findByText("顧客が登録されていません"),
    ).toBeInTheDocument();

    const searchInput = screen.getByRole("searchbox", {
      name: "顧客検索キーワード",
    });

    await user.type(searchInput, "  山田  ");

    // 検索ボタンではなくEnterキーで検索
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(mocks.fetchCustomers).toHaveBeenCalledTimes(2);
    });

    expect(mocks.fetchCustomers).toHaveBeenNthCalledWith(2, {
      visibility: "visible",
      customer_kind: undefined,
      query: "山田",
      page: 1,
      per_page: 20,
    });

    expect(
      await screen.findByText("検索条件に一致する顧客が見つかりません"),
    ).toBeInTheDocument();
  });

  it("検索条件をクリアすると、検索なしで顧客一覧を再取得する", async () => {
    const user = userEvent.setup();

    mocks.fetchCustomers.mockResolvedValue({
      status: "success",
      data: {
        customers: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 0,
        },
      },
    });

    render(<CustomerListPageClient />);

    expect(
      await screen.findByText("顧客が登録されていません"),
    ).toBeInTheDocument();

    const searchInput = screen.getByRole("searchbox", {
      name: "顧客検索キーワード",
    });

    await user.type(searchInput, "山田");

    await user.click(
      screen.getByRole("button", {
        name: "検索",
      }),
    );

    expect(
      await screen.findByText("検索条件に一致する顧客が見つかりません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "クリア",
      }),
    );

    await waitFor(() => {
      expect(mocks.fetchCustomers).toHaveBeenCalledTimes(3);
    });

    expect(mocks.fetchCustomers).toHaveBeenNthCalledWith(3, {
      visibility: "visible",
      customer_kind: undefined,
      query: undefined,
      page: 1,
      per_page: 20,
    });

    expect(searchInput).toHaveValue("");

    expect(
      await screen.findByText("顧客が登録されていません"),
    ).toBeInTheDocument();
  });

  it("顧客を登録を押すと、新規登録ダイアログを表示する", async () => {
    const user = userEvent.setup();

    mocks.fetchCustomers.mockResolvedValue({
      status: "success",
      data: {
        customers: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 0,
        },
      },
    });

    render(<CustomerListPageClient />);

    expect(
      await screen.findByText("顧客が登録されていません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "顧客を登録",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "顧客を登録",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("新しい顧客情報を入力します。"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "登録内容を確認",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("radio", {
        name: "個人",
      }),
    ).toBeChecked();

    expect(
      screen.getByRole("radio", {
        name: "法人",
      }),
    ).not.toBeChecked();
  });

  it("必須項目が未入力の場合、入力エラーを表示する", async () => {
    const user = userEvent.setup();

    mocks.fetchCustomers.mockResolvedValue({
      status: "success",
      data: {
        customers: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 0,
        },
      },
    });

    render(<CustomerListPageClient />);

    expect(
      await screen.findByText("顧客が登録されていません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "顧客を登録",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "登録内容を確認",
      }),
    );

    expect(screen.getByText("入力内容を確認してください")).toBeInTheDocument();

    expect(
      screen.getByText("赤字で表示された項目を修正してください。"),
    ).toBeInTheDocument();

    expect(screen.getByText("顧客名を入力してください")).toBeInTheDocument();

    expect(screen.getByText("フリガナを入力してください")).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "顧客を登録しますか？",
      }),
    ).not.toBeInTheDocument();
  });

  it("表示状態と顧客区分で絞り込める", async () => {
    const user = userEvent.setup();

    mocks.fetchCustomers.mockResolvedValue({
      status: "success",
      data: {
        customers: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 0,
        },
      },
    });

    render(<CustomerListPageClient />);

    expect(
      await screen.findByText("顧客が登録されていません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "絞り込み",
      }),
    );

    await user.click(
      screen.getByRole("radio", {
        name: "非表示",
      }),
    );

    await user.click(
      screen.getByRole("radio", {
        name: "法人",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "適用",
      }),
    );

    await waitFor(() => {
      expect(mocks.fetchCustomers).toHaveBeenCalledTimes(2);
    });

    expect(mocks.fetchCustomers).toHaveBeenNthCalledWith(2, {
      visibility: "hidden",
      customer_kind: "corporate",
      query: undefined,
      page: 1,
      per_page: 20,
    });

    expect(
      await screen.findByText("検索条件に一致する顧客が見つかりません"),
    ).toBeInTheDocument();
  });

  it("次へを押すと、次ページの顧客を取得する", async () => {
    const user = userEvent.setup();

    mocks.fetchCustomers.mockResolvedValue({
      status: "success",
      data: {
        customers: [
          {
            id: 1,
            customer_kind: "individual",
            name: "山田 太郎",
            kana: "ヤマダ タロウ",
            postal_code: null,
            address: null,
            phone_number: "09012345678",
            email: null,
            birthday: null,
            company_name: null,
            company_name_kana: null,
            company_postal_code: null,
            company_address: null,
            company_phone_number: null,
            company_email: null,
            memo: null,
            hidden: false,
            hidden_at: null,
            lock_version: 0,
            created_by_staff: null,
            updated_by_staff: null,
            created_at: "2026-09-06T00:00:00Z",
            updated_at: "2026-09-06T00:00:00Z",
          },
        ],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 2,
          total_count: 21,
        },
      },
    });

    render(<CustomerListPageClient />);

    expect(await screen.findByText("山田 太郎")).toBeInTheDocument();

    const nextButtons = screen.getAllByRole("button", {
      name: "次へ",
    });

    await user.click(nextButtons[0]);

    await waitFor(() => {
      expect(mocks.fetchCustomers).toHaveBeenCalledTimes(2);
    });

    expect(mocks.fetchCustomers).toHaveBeenNthCalledWith(2, {
      visibility: "visible",
      customer_kind: undefined,
      query: undefined,
      page: 2,
      per_page: 20,
    });
  });

  it("個人顧客を登録できる", async () => {
    const user = userEvent.setup();

    mocks.fetchCustomers.mockResolvedValue({
      status: "success",
      data: {
        customers: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 0,
        },
      },
    });

    mocks.createCustomer.mockResolvedValue({
      status: "success",
      data: {
        customer: {},
      },
    });

    render(<CustomerListPageClient />);

    expect(
      await screen.findByText("顧客が登録されていません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "顧客を登録",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "顧客名",
      }),
      "山田 太郎",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "フリガナ",
      }),
      "ヤマダ タロウ",
    );

    await user.click(
      screen.getByRole("button", {
        name: "登録内容を確認",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "この内容で顧客を登録しますか？",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "登録する",
      }),
    );

    await waitFor(() => {
      expect(mocks.createCustomer).toHaveBeenCalledWith({
        customer: {
          customer_kind: "individual",
          name: "山田 太郎",
          kana: "ヤマダ タロウ",
          postal_code: null,
          address: null,
          phone_number: null,
          email: null,
          birthday: null,
          company_name: null,
          company_name_kana: null,
          company_postal_code: null,
          company_address: null,
          company_phone_number: null,
          company_email: null,
          memo: null,
        },
      });
    });

    // 初期表示と登録後の再取得
    expect(mocks.fetchCustomers).toHaveBeenCalledTimes(2);
  });

  it("顧客の登録に失敗すると、エラーを表示する", async () => {
    const user = userEvent.setup();

    mocks.fetchCustomers.mockResolvedValue({
      status: "success",
      data: {
        customers: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 0,
        },
      },
    });

    mocks.createCustomer.mockRejectedValue(new Error("API通信エラー"));

    render(<CustomerListPageClient />);

    expect(
      await screen.findByText("顧客が登録されていません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "顧客を登録",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "顧客名",
      }),
      "山田 太郎",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "フリガナ",
      }),
      "ヤマダ タロウ",
    );

    await user.click(
      screen.getByRole("button", {
        name: "登録内容を確認",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "登録する",
      }),
    );

    expect(
      await screen.findByText("顧客の登録中に予期しないエラーが発生しました。"),
    ).toBeInTheDocument();

    expect(mocks.fetchCustomers).toHaveBeenCalledTimes(1);
  });

  it("顧客情報を編集できる", async () => {
    const user = userEvent.setup();

    const customer = {
      id: 1,
      customer_kind: "individual" as const,
      name: "山田 太郎",
      kana: "ヤマダ タロウ",
      postal_code: null,
      address: null,
      phone_number: "09012345678",
      email: null,
      birthday: null,
      company_name: null,
      company_name_kana: null,
      company_postal_code: null,
      company_address: null,
      company_phone_number: null,
      company_email: null,
      memo: null,
      hidden: false,
      hidden_at: null,
      lock_version: 3,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-06T00:00:00Z",
      updated_at: "2026-09-06T00:00:00Z",
    };

    mocks.fetchCustomers.mockResolvedValue({
      status: "success",
      data: {
        customers: [customer],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 1,
        },
      },
    });

    mocks.updateCustomer.mockResolvedValue({
      status: "success",
      data: {
        customer: {
          ...customer,
          name: "山田 次郎",
          lock_version: 4,
        },
      },
    });

    render(<CustomerListPageClient />);

    expect(await screen.findByText("山田 太郎")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "山田 太郎を編集",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "顧客情報を編集",
      }),
    ).toBeInTheDocument();

    const nameInput = screen.getByRole("textbox", {
      name: "顧客名",
    });

    expect(nameInput).toHaveValue("山田 太郎");

    await user.clear(nameInput);
    await user.type(nameInput, "山田 次郎");

    await user.click(
      screen.getByRole("button", {
        name: "更新内容を確認",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "この内容で顧客情報を更新しますか？",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "更新する",
      }),
    );

    await waitFor(() => {
      expect(mocks.updateCustomer).toHaveBeenCalledWith(1, {
        customer: {
          customer_kind: "individual",
          name: "山田 次郎",
          kana: "ヤマダ タロウ",
          postal_code: null,
          address: null,
          phone_number: "09012345678",
          email: null,
          birthday: null,
          company_name: null,
          company_name_kana: null,
          company_postal_code: null,
          company_address: null,
          company_phone_number: null,
          company_email: null,
          memo: null,
          lock_version: 3,
        },
      });
    });

    expect(mocks.fetchCustomers).toHaveBeenCalledTimes(2);
  });
});
