import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RfRankColorSettingsSection } from "../../../components/settings/RfRankColorSettingsSection";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  fetchStandardCodes: vi.fn(),
  updateStandardListCode: vi.fn(),
}));

vi.mock("@/features/staff-auth/hooks/use-auth", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("@/features/standard-codes/api/standard-code-api", () => ({
  fetchStandardCodes: mocks.fetchStandardCodes,
  updateStandardListCode: mocks.updateStandardListCode,
}));

const rfRankMasterResponse = {
  data: {
    standard_masters: [
      {
        id: 7,
        system_key: "rf_rank",
        display_code: "00007",
        name: "RFランク",
        description: null,
        position: 7,
        active: true,
        items: [
          {
            id: 31,
            display_code: "00031",
            label: "Aランク",
            description: null,
            position: 1,
            active: true,
            display_color: "#059669",
            default_display_color: "#059669",
          },
          {
            id: 32,
            display_code: "00032",
            label: "Bランク",
            description: null,
            position: 2,
            active: true,
            display_color: "#0D9488",
            default_display_color: "#0D9488",
          },
        ],
      },
    ],
  },
};

describe("RfRankColorSettingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({
      staff: { staff_master: { role_code: "owner" } },
    });
    mocks.fetchStandardCodes.mockResolvedValue(rfRankMasterResponse);
    mocks.updateStandardListCode.mockResolvedValue({
      data: { standard_list_master: {} },
    });
  });

  it("ownerがRFランクの色を変更して保存できる", async () => {
    const user = userEvent.setup();
    const onColorsChanged = vi.fn();

    render(<RfRankColorSettingsSection onColorsChanged={onColorsChanged} />);

    const colorInput = await screen.findByLabelText("Aランクの表示色");
    const saveButton = screen.getByRole("button", {
      name: "カラー設定を保存",
    });

    expect(colorInput).toHaveValue("#059669");
    expect(saveButton).toBeDisabled();

    fireEvent.change(colorInput, { target: { value: "#123456" } });
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    await waitFor(() => {
      expect(mocks.updateStandardListCode).toHaveBeenCalledWith(7, 31, {
        display_color: "#123456",
      });
    });
    expect(onColorsChanged).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("RFランクのカラー設定を保存しました。"),
    ).toBeInTheDocument();
  });

  it("operatorにはカラー変更操作を許可しない", async () => {
    mocks.useAuth.mockReturnValue({
      staff: { staff_master: { role_code: "operator" } },
    });

    render(<RfRankColorSettingsSection />);

    expect(await screen.findByLabelText("Aランクの表示色")).toBeDisabled();
    expect(
      screen.getByText("カラー設定を変更できるのはownerのみです。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "カラー設定を保存" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "初期色へ戻す" }),
    ).not.toBeInTheDocument();
  });

  it("初期色を選択し、保存すると反映できる", async () => {
    const user = userEvent.setup();
    const response = structuredClone(rfRankMasterResponse);

    response.data.standard_masters[0].items[0].display_color = "#123456";

    mocks.fetchStandardCodes.mockResolvedValue(response);

    render(<RfRankColorSettingsSection />);

    const colorInput = await screen.findByLabelText("Aランクの表示色");

    expect(colorInput).toHaveValue("#123456");

    await user.click(screen.getByRole("button", { name: "初期色へ戻す" }));

    expect(colorInput).toHaveValue("#059669");
    expect(mocks.updateStandardListCode).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "カラー設定を保存" }));

    await waitFor(() => {
      expect(mocks.updateStandardListCode).toHaveBeenCalledWith(7, 31, {
        display_color: "#059669",
      });
    });

    expect(
      await screen.findByText("RFランクのカラー設定を保存しました。"),
    ).toBeInTheDocument();
  });

  it("再取得すると新しく追加したランクが表示される", async () => {
    const user = userEvent.setup();
    const updatedResponse = structuredClone(rfRankMasterResponse);

    updatedResponse.data.standard_masters[0].items.push({
      id: 33,
      display_code: "00033",
      label: "Sランク",
      description: null,
      position: 3,
      active: true,
      display_color: "#123456",
      default_display_color: "#123456",
    });

    mocks.fetchStandardCodes
      .mockResolvedValueOnce(rfRankMasterResponse)
      .mockResolvedValueOnce(updatedResponse);

    render(<RfRankColorSettingsSection />);

    await screen.findByLabelText("Aランクの表示色");

    expect(screen.queryByLabelText("Sランクの表示色")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "ランク一覧を再取得" }),
    );

    expect(await screen.findByLabelText("Sランクの表示色")).toHaveValue(
      "#123456",
    );

    expect(mocks.fetchStandardCodes).toHaveBeenCalledTimes(2);
    expect(mocks.updateStandardListCode).not.toHaveBeenCalled();
  });

  it("色を編集中は一覧を再取得できない", async () => {
    const user = userEvent.setup();

    render(<RfRankColorSettingsSection />);

    const colorInput = await screen.findByLabelText("Aランクの表示色");
    const reloadButton = screen.getByRole("button", {
      name: "ランク一覧を再取得",
    });

    expect(reloadButton).toBeEnabled();

    fireEvent.change(colorInput, {
      target: { value: "#123456" },
    });

    expect(reloadButton).toBeDisabled();

    await user.click(reloadButton);

    expect(mocks.fetchStandardCodes).toHaveBeenCalledTimes(1);
    expect(colorInput).toHaveValue("#123456");

    // 元の色へ戻すと未保存の変更がなくなり、再取得できる。
    fireEvent.change(colorInput, {
      target: { value: "#059669" },
    });

    expect(reloadButton).toBeEnabled();
  });

  it("operatorも一覧を再取得できる", async () => {
    const user = userEvent.setup();

    mocks.useAuth.mockReturnValue({
      staff: { staff_master: { role_code: "operator" } },
    });

    render(<RfRankColorSettingsSection />);

    expect(await screen.findByLabelText("Aランクの表示色")).toBeDisabled();

    const reloadButton = screen.getByRole("button", {
      name: "ランク一覧を再取得",
    });

    expect(reloadButton).toBeEnabled();

    await user.click(reloadButton);

    await waitFor(() => {
      expect(mocks.fetchStandardCodes).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByLabelText("Aランクの表示色")).toBeDisabled();

    expect(mocks.updateStandardListCode).not.toHaveBeenCalled();
  });
});
