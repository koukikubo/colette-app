import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { renderWithOwner } from "@/test-utils/auth";
import { CustomerStaffMemo } from "../components/detail/CustomerStaffMemo";
import type { Customer } from "../types";
const update = vi.hoisted(() => vi.fn());
vi.mock("../api/customer-api", () => ({ updateCustomer: update }));
const customer = { id: 10, memo: "窓側希望", lock_version: 3 } as Customer;
it("メモを既存版で保存し、上部へ更新結果を渡す", async () => {
  const user = userEvent.setup();
  const saved = vi.fn();
  update.mockResolvedValue({
    data: { customer: { ...customer, memo: "家族利用", lock_version: 4 } },
  });
  renderWithOwner(
    <CustomerStaffMemo
      customer={customer}
      onSaved={saved}
      onEditingChange={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "メモを編集" }));
  await user.clear(screen.getByRole("textbox", { name: "スタッフ共有メモ" }));
  await user.type(
    screen.getByRole("textbox", { name: "スタッフ共有メモ" }),
    "家族利用",
  );
  await user.click(screen.getByRole("button", { name: "メモを保存" }));
  expect(await screen.findByRole("status")).toHaveTextContent("保存しました");
  expect(update).toHaveBeenLastCalledWith(10, {
    customer: { memo: "家族利用", lock_version: 3 },
  });
  expect(saved).toHaveBeenCalledWith(
    expect.objectContaining({ lock_version: 4 }),
  );
});
it("通信失敗時にも入力を保持する", async () => {
  const user = userEvent.setup();
  update.mockRejectedValue(new Error("offline"));
  renderWithOwner(
    <CustomerStaffMemo
      customer={customer}
      onSaved={vi.fn()}
      onEditingChange={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "メモを編集" }));
  await user.type(
    screen.getByRole("textbox", { name: "スタッフ共有メモ" }),
    "・お祝い",
  );
  await user.click(screen.getByRole("button", { name: "メモを保存" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("入力は保持");
  expect(screen.getByRole("textbox", { name: "スタッフ共有メモ" })).toHaveValue(
    "窓側希望・お祝い",
  );
});
