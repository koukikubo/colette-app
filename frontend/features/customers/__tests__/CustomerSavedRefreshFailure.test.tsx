import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { CustomerFormDialog } from "../components/dialogs/CustomerFormDialog";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("../api/customer-api", () => ({ createCustomer: mocks.create }));
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
