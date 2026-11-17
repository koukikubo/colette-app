import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { renderWithOwner } from "@/test-utils/auth";
import { CustomerListPageClient } from "../components/list/CustomerListPageClient";
const mocks = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn() }));
vi.mock("../api/customer-api", () => ({
  fetchCustomers: mocks.list,
  createCustomer: mocks.create,
}));
vi.mock("@/features/standard-codes/api/standard-code-api", () => ({
  fetchStandardCodes: vi
    .fn()
    .mockResolvedValue({ data: { standard_masters: [] } }),
}));
const pagination = {
  current_page: 1,
  per_page: 20,
  total_count: 0,
  total_pages: 0,
};
beforeEach(() => {
  mocks.list
    .mockReset()
    .mockResolvedValue({ data: { customers: [], pagination } });
  mocks.create.mockReset().mockResolvedValue({ data: { customer: { id: 1 } } });
});
async function openForm() {
  const user = userEvent.setup();
  renderWithOwner(<CustomerListPageClient />);
  await screen.findByText("顧客が登録されていません");
  await user.click(screen.getByRole("button", { name: "顧客を登録" }));
  return user;
}
it("実フォームで保存成功後のGET失敗を保存済みと表示し、GETだけ再試行する", async () => {
  const user = await openForm();
  await user.type(screen.getByLabelText(/顧客名/), "登録対象");
  await user.type(screen.getByLabelText(/フリガナ/), "トウロクタイショウ");
  mocks.list.mockRejectedValueOnce(new Error("GET failed"));
  await user.click(screen.getByRole("button", { name: "登録内容を確認" }));
  await user.click(screen.getByRole("button", { name: "登録する" }));
  expect(await screen.findByText("顧客情報は保存済みです")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("保存は完了");
  expect(mocks.create).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "表示を再取得" }));
  await waitFor(() =>
    expect(
      screen.queryByText("顧客情報は保存済みです"),
    ).not.toBeInTheDocument(),
  );
  expect(mocks.list).toHaveBeenCalledTimes(3);
  expect(mocks.create).toHaveBeenCalledTimes(1);
});
it("未保存入力を閉じる前に確認し、続行なら入力を維持する", async () => {
  const user = await openForm();
  await user.type(screen.getByLabelText(/顧客名/), "未保存");
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  await user.click(screen.getByRole("button", { name: "キャンセル" }));
  expect(await screen.findByRole("alertdialog")).toHaveTextContent(
    "入力内容を破棄",
  );
  await user.click(screen.getByRole("button", { name: "編集を続ける" }));
  expect(screen.getByLabelText(/顧客名/)).toHaveValue("未保存");
  await user.click(screen.getByRole("button", { name: "キャンセル" }));
  await user.click(screen.getByRole("button", { name: "入力内容を破棄する" }));
  expect(screen.queryByLabelText(/顧客名/)).not.toBeInTheDocument();
  expect(mocks.create).not.toHaveBeenCalled();
});
