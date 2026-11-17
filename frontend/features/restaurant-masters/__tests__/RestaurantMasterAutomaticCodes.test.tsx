import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { renderWithOwner } from "@/test-utils/auth";
import { RestaurantMasterMasterPage } from "../components/management/RestaurantMasterPage";
const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  codes: vi.fn(),
  create: vi.fn(),
}));
vi.mock("../api/restaurant-masters-api", () => ({
  fetchRestaurantMasters: mocks.list,
  createRestaurantMaster: mocks.create,
}));
vi.mock("@/features/standard-codes/api/standard-code-api", () => ({
  fetchStandardCodes: mocks.codes,
}));
beforeEach(() => {
  mocks.list
    .mockReset()
    .mockResolvedValue({ data: { restaurant_masters: [] } });
  mocks.codes.mockReset().mockResolvedValue({
    data: {
      standard_masters: [
        {
          id: 1,
          system_key: "restaurant_master_type",
          name: "店内の区分",
          active: true,
          items: [
            { id: 10, code: "T", label: "テーブル席", active: true },
            { id: 11, code: "C", label: "カウンター席", active: true },
            { id: 12, code: null, label: "個室希望", active: true },
          ],
        },
      ],
    },
  });
  mocks.create
    .mockReset()
    .mockResolvedValue({ data: { restaurant_master: { id: 1, code: "T01" } } });
});
async function open() {
  const user = userEvent.setup();
  renderWithOwner(<RestaurantMasterMasterPage />);
  await screen.findByText("登録されている席はありません");
  await user.click(screen.getByRole("button", { name: "席を登録" }));
  return user;
}
it("親分類の表示名に依存せず、実席はT/Cだけから選択しコードを入力させない", async () => {
  const user = await open();
  expect(screen.queryByLabelText("表示順")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("席コード")).not.toBeInTheDocument();
  expect(screen.getByText(/T01/)).toHaveTextContent("C01");
  await user.click(screen.getByRole("combobox", { name: "席種" }));
  expect(
    screen.getByRole("option", { name: "テーブル席" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("option", { name: "カウンター席" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "個室希望" }),
  ).not.toBeInTheDocument();
});
it("実席の保存成功後に一覧取得が失敗しても、再取得だけを行う", async () => {
  const user = await open();
  await user.click(screen.getByRole("combobox", { name: "席種" }));
  await user.click(screen.getByRole("option", { name: "テーブル席" }));
  await user.type(screen.getByRole("textbox", { name: "席名" }), "個室1");
  mocks.list.mockRejectedValueOnce(new Error("GET failed"));
  await user.click(screen.getByRole("button", { name: "登録する" }));
  expect(await screen.findByText("席情報は保存済みです")).toBeInTheDocument();
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(mocks.create.mock.calls[0][0].restaurant_master).not.toHaveProperty(
    "code",
  );
  expect(mocks.create.mock.calls[0][0].restaurant_master).not.toHaveProperty(
    "sequence_number",
  );
  await user.click(screen.getByRole("button", { name: "表示を再取得" }));
  await waitFor(() =>
    expect(screen.queryByText("席情報は保存済みです")).not.toBeInTheDocument(),
  );
  expect(mocks.create).toHaveBeenCalledTimes(1);
});
