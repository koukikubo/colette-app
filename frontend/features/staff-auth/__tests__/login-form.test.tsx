import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "../components/login/login-form";
import { ApiClientError } from "@/lib/api/api-client";

const mocks = vi.hoisted(() => ({
  loginStaff: vi.fn(),
  refreshCurrentStaff: vi.fn(),
  replace: vi.fn(),
}));

// loginStaff、refreshCurrentStaff、router.replaceをモックし、LoginFormが正しい順序と値で呼び出すかを確認(backendとの通信は行わない)
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
  }),
}));

vi.mock("../api/staff-auth-api", () => ({
  loginStaff: mocks.loginStaff,
}));

vi.mock("@/features/staff-auth/hooks/use-auth", () => ({
  useAuth: () => ({
    refreshCurrentStaff: mocks.refreshCurrentStaff,
  }),
}));

describe("LoginForm", () => {
  it("担当者を選択せずにログインすると、担当者選択を促すメッセージを表示する", async () => {
    const user = userEvent.setup();

    render(
      <LoginForm
        staffOptions={[
          { id: 1, code: "00001", name: "店主" },
          { id: 2, code: "00002", name: "登録担当" },
        ]}
      />,
    );

    await user.type(screen.getByLabelText("パスワード"), "test-password");

    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(screen.getByText("担当者を選択してください。")).toBeInTheDocument();
  });

  // 成功のケース
  it("正しい担当者とパスワードでログインすると、ダッシュボードへ遷移する", async () => {
    const user = userEvent.setup();

    mocks.loginStaff.mockResolvedValue(undefined);
    mocks.refreshCurrentStaff.mockResolvedValue(undefined);

    render(
      <LoginForm
        staffOptions={[
          { id: 1, code: "00001", name: "店主" },
          { id: 2, code: "00002", name: "登録担当" },
        ]}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "担当者" }));

    await user.click(await screen.findByRole("option", { name: "00001店主" }));

    await user.type(screen.getByLabelText("パスワード"), "test-password");

    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(mocks.loginStaff).toHaveBeenCalledWith({
        staff: {
          staff_id: 1,
          password: "test-password",
        },
      });
    });

    await waitFor(() => {
      expect(mocks.refreshCurrentStaff).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/dashboard");
    });

    expect(mocks.refreshCurrentStaff).toHaveBeenCalledTimes(1);
  });

  it("ログイン API が認証エラーを返すと、エラーを表示して画面遷移しない", async () => {
    const user = userEvent.setup();
    const errorMessage = "担当者またはパスワードが正しくありません。";

    mocks.loginStaff.mockRejectedValue(new ApiClientError(errorMessage, 401));

    render(
      <LoginForm
        staffOptions={[
          { id: 1, code: "00001", name: "店主" },
          { id: 2, code: "00002", name: "登録担当" },
        ]}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "担当者" }));
    await user.click(await screen.findByRole("option", { name: "00001店主" }));
    await user.type(screen.getByLabelText("パスワード"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(mocks.refreshCurrentStaff).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  // ③ API認証失敗のケース
  it("ログイン API が認証エラーを返すと、エラーを表示して画面遷移しない", async () => {
    const user = userEvent.setup();
    const errorMessage = "担当者またはパスワードが正しくありません。";

    mocks.loginStaff.mockRejectedValue(new ApiClientError(errorMessage, 401));

    render(
      <LoginForm
        staffOptions={[
          { id: 1, code: "00001", name: "店主" },
          { id: 2, code: "00002", name: "登録担当" },
        ]}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "担当者" }));
    await user.click(await screen.findByRole("option", { name: "00001店主" }));
    await user.type(screen.getByLabelText("パスワード"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(mocks.refreshCurrentStaff).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  // ② パスワード未入力のケース
  it("パスワードが未入力なら、ログイン処理を実行しない", async () => {
    const user = userEvent.setup();

    render(
      <LoginForm
        staffOptions={[
          { id: 1, code: "00001", name: "店主" },
          { id: 2, code: "00002", name: "登録担当" },
        ]}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "担当者" }));
    await user.click(await screen.findByRole("option", { name: "00001店主" }));

    const passwordInput = screen.getByLabelText("パスワード");

    expect(passwordInput).toBeRequired();
    expect(passwordInput).toBeInvalid();

    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(mocks.loginStaff).not.toHaveBeenCalled();
    expect(mocks.refreshCurrentStaff).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
