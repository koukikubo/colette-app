import { screen } from "@testing-library/react";
import { renderWithOwner as render } from "@/test-utils/auth";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { StandardCodeFormDialog } from "../components/Dialog/StandardCodeFormDialog";

const places = [
  {
    id: 27,
    key: "customer_details",
    name: "顧客詳細",
    description: "顧客で利用",
  },
  {
    id: 81,
    key: "reservation_details",
    name: "予約詳細",
    description: "予約画面への表示・入力は後続対応です。",
  },
];

describe("基本コードの使用場所", () => {
  it("サーバー由来の使用場所と入力方法を個別に選び、新契約だけを送る", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <StandardCodeFormDialog
        open
        mode="create"
        usagePlaces={places}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("名称"), "好み");
    await user.selectOptions(screen.getByLabelText("使用場所"), "81");
    expect(
      screen.getByText("予約画面への表示・入力は後続対応です。"),
    ).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("入力方法"), "multiple");
    await user.selectOptions(screen.getByLabelText("使用場所"), "27");
    expect(screen.getByLabelText("入力方法")).toHaveValue("multiple");
    await user.click(screen.getByRole("button", { name: "登録" }));
    await user.click(screen.getByRole("button", { name: "保存する" }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "好み",
      description: null,
      active: true,
      usage_place_id: 27,
      input_type: "multiple",
      input_group: null,
    });
  });

  it("既存設定を保持し、業務用コードでは用途設定を公開しない", () => {
    render(
      <StandardCodeFormDialog
        open
        mode="edit"
        standardCode={{
          id: 1,
          system_key: "reservation_status",
          display_code: "00001",
          name: "予約状況",
          description: null,
          active: true,
          position: 1,
        }}
        usagePlaces={places}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("システム用（用途固定）")).toBeInTheDocument();
    expect(screen.queryByLabelText("使用場所")).not.toBeInTheDocument();
  });
});
