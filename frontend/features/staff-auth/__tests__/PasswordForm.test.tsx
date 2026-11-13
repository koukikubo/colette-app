import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { PasswordForm } from "../components/session/PasswordForm";
import { renderWithRole } from "@/test-utils/auth";
const mocks = vi.hoisted(() => ({ reset: vi.fn(), change: vi.fn() }));
vi.mock("../api/password-api", () => ({
  resetPassword: mocks.reset,
  changePassword: mocks.change,
}));
it("管理者再設定後の表示更新失敗でも保存済みとし再設定を繰り返さない", async () => {
  mocks.reset.mockResolvedValue({});
  renderWithRole(
    <PasswordForm
      target={{ id: 4, lock_version: 7, name: "対象" }}
      onCompleted={vi.fn().mockRejectedValue(new Error("offline"))}
    />,
    "owner",
  );
  const user = userEvent.setup();
  await user.type(
    screen.getByLabelText("管理者の現在のパスワード"),
    "Password123!",
  );
  await user.type(
    screen.getByLabelText("新しいパスワード（12文字以上）"),
    "ChangedPassword456!",
  );
  await user.type(
    screen.getByLabelText("新しいパスワード（確認）"),
    "ChangedPassword456!",
  );
  await user.click(screen.getByRole("button", { name: "パスワードを変更" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("変更しました"),
  );
  expect(mocks.reset).toHaveBeenCalledWith(4, 7, {
    current_password: "Password123!",
    password: "ChangedPassword456!",
    password_confirmation: "ChangedPassword456!",
  });
  expect(
    screen.queryByRole("button", { name: "パスワードを変更" }),
  ).not.toBeInTheDocument();
});
