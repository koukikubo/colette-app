import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import type { Customer } from "../types";
import { CustomerFormDialog } from "../components/dialogs/CustomerFormDialog";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  hide: vi.fn(),
  restore: vi.fn(),
  update: vi.fn(),
}));
vi.mock("../api/customer-api", () => ({
  createCustomer: mocks.create,
  hideCustomer: mocks.hide,
  restoreCustomer: mocks.restore,
  updateCustomer: mocks.update,
}));
vi.mock("@/features/standard-codes/api/standard-code-api", () => ({
  fetchStandardCodes: vi
    .fn()
    .mockResolvedValue({ data: { standard_masters: [] } }),
}));
vi.mock("../components/form/CustomerForm", () => ({
  CustomerForm: ({
    formId,
    onSubmit,
  }: {
    formId: string;
    onSubmit: React.FormEventHandler;
  }) => <form id={formId} onSubmit={onSubmit} />,
}));
// 実フォームの入力は既存テストで検証し、ここでは保存後の再取得障害を注入する。
vi.mock("../utils/customer-form-validation", () => ({
  validateCustomerFormValues: () => ({}),
}));

it("保存後の再取得失敗は保存済みと表示し、再取得だけ再試行する", async () => {
  mocks.create.mockResolvedValue({ data: { customer: { id: 1 } } });
  const completed = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(undefined);
  render(
    <CustomerFormDialog
      open
      mode="create"
      customer={null}
      allowVisibilityChange={false}
      onOpenChange={vi.fn()}
      onCompleted={completed}
    />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "登録内容を確認" }));
  await user.click(screen.getByRole("button", { name: "登録する" }));
  expect(await screen.findByText(/保存済みです/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "表示を再取得" }));
  await waitFor(() => expect(completed).toHaveBeenCalledTimes(2));
  expect(mocks.create).toHaveBeenCalledTimes(1);
});

it.each([false, true])(
  "非表示状態%sの変更後にGETだけ失敗しても変更を再送しない",
  async (hidden) => {
    const customer: Customer = {
      id: 10,
      customer_kind: "individual",
      name: "顧客",
      kana: "コキャク",
      postal_code: null,
      address: null,
      phone_number: null,
      email: null,
      birthday: null,
      customer_rank_id: null,
      customer_rank: null,
      company_name: null,
      company_name_kana: null,
      company_postal_code: null,
      company_address: null,
      company_phone_number: null,
      company_email: null,
      memo: null,
      hidden,
      hidden_at: null,
      lock_version: 2,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    mocks.hide.mockResolvedValue({
      data: { customer: { ...customer, hidden: true, lock_version: 3 } },
    });
    mocks.restore.mockResolvedValue({
      data: { customer: { ...customer, hidden: false, lock_version: 3 } },
    });
    const completed = vi
      .fn()
      .mockRejectedValueOnce(new Error("GET failed"))
      .mockResolvedValue(undefined);
    render(
      <CustomerFormDialog
        open
        mode="edit"
        customer={customer}
        allowVisibilityChange
        onOpenChange={vi.fn()}
        onCompleted={completed}
      />,
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: hidden ? "顧客を復帰する" : "顧客を非表示にする",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: hidden ? "復帰する" : "非表示にする",
      }),
    );
    await screen.findByText("顧客情報は保存済みです");
    await user.click(screen.getByRole("button", { name: "表示を再取得" }));
    await waitFor(() => expect(completed).toHaveBeenCalledTimes(2));
    expect(hidden ? mocks.restore : mocks.hide).toHaveBeenCalledTimes(1);
  },
);

it("背景取得でpropsの版が進んでも、編集開始時の版と入力で保存する", async () => {
  const customer: Customer = {
    id: 10,
    customer_kind: "individual",
    name: "顧客",
    kana: "コキャク",
    postal_code: null,
    address: null,
    phone_number: null,
    email: null,
    birthday: null,
    customer_rank_id: null,
    customer_rank: null,
    company_name: null,
    company_name_kana: null,
    company_postal_code: null,
    company_address: null,
    company_phone_number: null,
    company_email: null,
    memo: null,
    hidden: false,
    hidden_at: null,
    lock_version: 2,
    created_by_staff: null,
    updated_by_staff: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
  mocks.update.mockResolvedValue({ data: { customer } });
  const completed = vi.fn().mockResolvedValue(undefined);
  const props = {
    open: true,
    mode: "edit" as const,
    allowVisibilityChange: true,
    onOpenChange: vi.fn(),
    onCompleted: completed,
  };
  const view = render(<CustomerFormDialog {...props} customer={customer} />);
  view.rerender(
    <CustomerFormDialog
      {...props}
      customer={{ ...customer, lock_version: 3, memo: "別の担当者の更新" }}
    />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "更新内容を確認" }));
  await user.click(screen.getByRole("button", { name: "更新する" }));
  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith(10, {
      customer: expect.objectContaining({ lock_version: 2, memo: null }),
    }),
  );
});
