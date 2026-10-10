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
          },
          {
            id: 32,
            display_code: "00032",
            label: "Bランク",
            description: null,
            position: 2,
            active: true,
            display_color: "#0D9488",
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
  });
});
