import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RestaurantMasterMasterPage } from "../components/management/RestaurantMasterPage";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  fetchRestaurantMasters: vi.fn(),
  fetchStandardCodes: vi.fn(),
  createRestaurantMaster: vi.fn(),
  updateRestaurantMaster: vi.fn(),
}));

vi.mock("../api/restaurant-masters-api", () => ({
  fetchRestaurantMasters: mocks.fetchRestaurantMasters,
  createRestaurantMaster: mocks.createRestaurantMaster,
  updateRestaurantMaster: mocks.updateRestaurantMaster,
}));

vi.mock("../../standard-codes/api/standard-code-api", () => ({
  fetchStandardCodes: mocks.fetchStandardCodes,
}));

describe("RestaurantMasterMasterPage", () => {
  it("予約席を一覧に表示する", async () => {
    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [
          {
            id: 1,
            restaurant_master_type_id: 10,
            restaurant_master_type: {
              id: 10,
              code: "COUNTER",
              label: "カウンター",
            },
            sequence_number: 1,
            code: "C01",
            name: "カウンター1",
            capacity: 1,
            active: true,
            memo: null,
            lock_version: 0,
            created_by_staff: null,
            updated_by_staff: null,
            created_at: "2026-09-06T00:00:00Z",
            updated_at: "2026-09-06T00:00:00Z",
          },
        ],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
            ],
          },
        ],
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(await screen.findByText("カウンター1")).toBeInTheDocument();
    expect(screen.getByText("C01")).toBeInTheDocument();
    expect(screen.getByText("カウンター")).toBeInTheDocument();
    expect(screen.getByText("1名")).toBeInTheDocument();

    expect(mocks.fetchRestaurantMasters).toHaveBeenCalledTimes(1);
    expect(mocks.fetchStandardCodes).toHaveBeenCalledTimes(1);
  });

  // 正常系
  it("予約席が登録されていない場合、空表示メッセージを表示する", async () => {
    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
            ],
          },
        ],
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(
      await screen.findByText("登録されている席はありません"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("「席を登録」から最初の席を登録してください。"),
    ).toBeInTheDocument();

    expect(screen.queryByText("カウンター1")).not.toBeInTheDocument();
  });

  // 異常系
  it("予約席マスタの取得に失敗すると、エラーを表示する", async () => {
    mocks.fetchRestaurantMasters.mockRejectedValue(new Error("API通信エラー"));

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
            ],
          },
        ],
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(
      await screen.findByText("席マスタを取得できませんでした"),
    ).toBeInTheDocument();

    expect(screen.getByText("API通信エラー")).toBeInTheDocument();
  });

  it("予約席種マスタが存在しない場合、エラーを表示する", async () => {
    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 2,
            system_key: "reservation_status",
            display_code: "RESERVATION_STATUS",
            name: "予約状態",
            description: "予約状態を管理します",
            position: 1,
            active: true,
            items: [],
          },
        ],
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(
      await screen.findByText("席マスタを取得できませんでした"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("予約席種マスタが見つかりません。"),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("登録されている席はありません"),
    ).not.toBeInTheDocument();
  });

  it("有効な予約席種が存在しない場合、エラーを表示する", async () => {
    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: false,
              },
            ],
          },
        ],
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(
      await screen.findByText("席マスタを取得できませんでした"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("有効な予約席種が登録されていません。"),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("登録されている席はありません"),
    ).not.toBeInTheDocument();
  });

  // 予約登録テスト
  it("テーブルを登録を押すと、新規登録ダイアログを表示する", async () => {
    const user = userEvent.setup();

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
              {
                id: 11,
                display_code: "TABLE",
                label: "テーブル",
                description: null,
                position: 2,
                active: true,
              },
            ],
          },
        ],
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(
      await screen.findByText("登録されている席はありません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "テーブルを登録",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "席マスタを新規登録",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("席種、席名、定員などを入力してください。"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "登録する",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "キャンセル",
      }),
    ).toBeInTheDocument();
  });

  it("予約席を登録できる", async () => {
    const user = userEvent.setup();

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
            ],
          },
        ],
      },
    });

    mocks.createRestaurantMaster.mockResolvedValue({
      status: "success",
      data: {
        restaurant_master: {},
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(
      await screen.findByText("登録されている席はありません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "テーブルを登録",
      }),
    );

    await user.click(
      screen.getByRole("combobox", {
        name: "席種",
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "カウンター",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "席名",
      }),
      "カウンター1",
    );

    const numberInputs = screen.getAllByRole("spinbutton");

    // [0] は定員、[1] は表示順
    await user.clear(numberInputs[0]);
    await user.type(numberInputs[0], "2");

    await user.type(
      screen.getByRole("textbox", {
        name: "メモ",
      }),
      "入口側のカウンター",
    );

    await user.click(
      screen.getByRole("button", {
        name: "登録する",
      }),
    );

    await waitFor(() => {
      expect(mocks.createRestaurantMaster).toHaveBeenCalledWith({
        restaurant_master: {
          restaurant_master_type_id: 10,
          name: "カウンター1",
          capacity: 2,
          active: true,
          memo: "入口側のカウンター",
        },
      });
    });

    expect(mocks.fetchRestaurantMasters).toHaveBeenCalledTimes(2);
  });

  // 入力チェック
  it("席種を選択せずに登録すると、入力エラーを表示する", async () => {
    const user = userEvent.setup();

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
            ],
          },
        ],
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(
      await screen.findByText("登録されている席はありません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "テーブルを登録",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "登録する",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "席種を選択してください。",
    );

    expect(mocks.createRestaurantMaster).not.toHaveBeenCalled();
  });

  it("席名を入力せずに登録すると、入力エラーを表示する", async () => {
    const user = userEvent.setup();

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
            ],
          },
        ],
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(
      await screen.findByText("登録されている席はありません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "テーブルを登録",
      }),
    );

    // 席種は選択する
    await user.click(
      screen.getByRole("combobox", {
        name: "席種",
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "カウンター",
      }),
    );

    // 席名は入力せずに登録する
    await user.click(
      screen.getByRole("button", {
        name: "登録する",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "席名を入力してください。",
    );

    expect(mocks.createRestaurantMaster).not.toHaveBeenCalled();
  });

  it("定員が1未満の場合、入力エラーを表示する", async () => {
    const user = userEvent.setup();

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
            ],
          },
        ],
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(
      await screen.findByText("登録されている席はありません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "テーブルを登録",
      }),
    );

    await user.click(
      screen.getByRole("combobox", {
        name: "席種",
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "カウンター",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "席名",
      }),
      "カウンター1",
    );

    const numberInputs = screen.getAllByRole("spinbutton");

    // [0]が定員
    await user.clear(numberInputs[0]);
    await user.type(numberInputs[0], "0");

    await user.click(
      screen.getByRole("button", {
        name: "登録する",
      }),
    );

    expect(numberInputs[0]).toBeInvalid();
    expect(mocks.createRestaurantMaster).not.toHaveBeenCalled();
  });

  it("表示順が1未満の場合、登録できない", async () => {
    const user = userEvent.setup();

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
            ],
          },
        ],
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(
      await screen.findByText("登録されている席はありません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "テーブルを登録",
      }),
    );

    await user.click(
      screen.getByRole("combobox", {
        name: "席種",
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "カウンター",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "席名",
      }),
      "カウンター1",
    );

    const numberInputs = screen.getAllByRole("spinbutton");

    // [1]が表示順
    await user.clear(numberInputs[1]);
    await user.type(numberInputs[1], "0");

    await user.click(
      screen.getByRole("button", {
        name: "登録する",
      }),
    );

    expect(numberInputs[1]).toBeInvalid();
    expect(mocks.createRestaurantMaster).not.toHaveBeenCalled();
  });

  it("予約席の登録に失敗すると、エラーを表示する", async () => {
    const user = userEvent.setup();

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
            ],
          },
        ],
      },
    });

    mocks.createRestaurantMaster.mockRejectedValue(new Error("API通信エラー"));

    render(<RestaurantMasterMasterPage />);

    expect(
      await screen.findByText("登録されている席はありません"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "テーブルを登録",
      }),
    );

    await user.click(
      screen.getByRole("combobox", {
        name: "席種",
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "カウンター",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "席名",
      }),
      "カウンター1",
    );

    await user.click(
      screen.getByRole("button", {
        name: "登録する",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "席マスタの登録に失敗しました。",
    );

    expect(mocks.createRestaurantMaster).toHaveBeenCalledWith({
      restaurant_master: {
        restaurant_master_type_id: 10,
        name: "カウンター1",
        capacity: 1,
        active: true,
        memo: null,
      },
    });

    // 登録失敗時は一覧を再取得しない
    expect(mocks.fetchRestaurantMasters).toHaveBeenCalledTimes(1);
  });

  it("予約席を編集できる", async () => {
    const user = userEvent.setup();

    const restaurantMaster = {
      id: 1,
      restaurant_master_type_id: 10,
      restaurant_master_type: {
        id: 10,
        code: "COUNTER",
        label: "カウンター",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 1,
      active: true,
      memo: null,
      lock_version: 3,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-06T00:00:00Z",
      updated_at: "2026-09-06T00:00:00Z",
    };

    const updatedRestaurantMaster = {
      ...restaurantMaster,
      name: "窓側カウンター",
      capacity: 2,
      lock_version: 4,
    };

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [restaurantMaster],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
            ],
          },
        ],
      },
    });

    mocks.updateRestaurantMaster.mockResolvedValue({
      status: "success",
      data: {
        restaurant_master: updatedRestaurantMaster,
      },
    });

    render(<RestaurantMasterMasterPage />);

    expect(await screen.findByText("カウンター1")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "カウンター1を編集",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "席マスタを編集",
      }),
    ).toBeInTheDocument();

    const nameInput = screen.getByRole("textbox", {
      name: "席名",
    });

    await user.clear(nameInput);
    await user.type(nameInput, "窓側カウンター");

    const capacityInput = screen.getByRole("spinbutton", {
      name: "定員",
    });

    await user.clear(capacityInput);
    await user.type(capacityInput, "2");

    await user.click(
      screen.getByRole("button", {
        name: "更新する",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "席マスタを更新しますか？",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "更新を確定する",
      }),
    );

    await waitFor(() => {
      expect(mocks.updateRestaurantMaster).toHaveBeenCalledWith(1, {
        restaurant_master: {
          name: "窓側カウンター",
          capacity: 2,
          active: true,
          memo: null,
          lock_version: 3,
        },
      });
    });

    expect(await screen.findByText("窓側カウンター")).toBeInTheDocument();
    expect(screen.queryByText("カウンター1")).not.toBeInTheDocument();
  });

  it("予約席の更新に失敗すると、エラーを表示する", async () => {
    const user = userEvent.setup();

    const restaurantMaster = {
      id: 1,
      restaurant_master_type_id: 10,
      restaurant_master_type: {
        id: 10,
        code: "COUNTER",
        label: "カウンター",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 1,
      active: true,
      memo: null,
      lock_version: 3,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-06T00:00:00Z",
      updated_at: "2026-09-06T00:00:00Z",
    };

    mocks.fetchRestaurantMasters.mockResolvedValue({
      status: "success",
      data: {
        restaurant_masters: [restaurantMaster],
      },
    });

    mocks.fetchStandardCodes.mockResolvedValue({
      status: "success",
      data: {
        standard_masters: [
          {
            id: 1,
            system_key: "reservation_table_type",
            display_code: "RESERVATION_TABLE_TYPE",
            name: "予約席種",
            description: "予約席の種別を管理します",
            position: 1,
            active: true,
            items: [
              {
                id: 10,
                display_code: "COUNTER",
                label: "カウンター",
                description: null,
                position: 1,
                active: true,
              },
            ],
          },
        ],
      },
    });

    mocks.updateRestaurantMaster.mockRejectedValue(new Error("API通信エラー"));

    render(<RestaurantMasterMasterPage />);

    expect(await screen.findByText("カウンター1")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "カウンター1を編集",
      }),
    );

    const nameInput = screen.getByRole("textbox", {
      name: "席名",
    });

    await user.clear(nameInput);
    await user.type(nameInput, "窓側カウンター");

    await user.click(
      screen.getByRole("button", {
        name: "更新する",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "席マスタを更新しますか？",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "更新を確定する",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "席マスタの更新に失敗しました。",
    );

    expect(mocks.updateRestaurantMaster).toHaveBeenCalledWith(1, {
      restaurant_master: {
        name: "窓側カウンター",
        capacity: 1,
        active: true,
        memo: null,
        lock_version: 3,
      },
    });
  });
});
