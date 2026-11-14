import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthContext, AuthProvider } from "../providers/AuthProvider";
import { ApiClientError } from "@/lib/api/api-client";
import {
  SESSION_EXPIRED_EVENT,
  safeReturnPath,
} from "@/lib/api/session-events";
const mocks = vi.hoisted(() => ({
  current: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("../api/staff-auth-api", () => ({
  fetchCurrentStaff: mocks.current,
  loginStaff: mocks.login,
  logoutStaff: mocks.logout,
}));
const staff = {
  id: 1,
  staff_master: { id: 1, name: "担当者", code: "S1", role_code: "operator" },
};
function Content() {
  const auth = useContext(AuthContext)!;
  return (
    <>
      <span>{auth.status}</span>
      <input aria-label="編集中の入力" defaultValue="未保存の予約" />
      <button
        onClick={() => void auth.refreshCurrentStaff().catch(() => undefined)}
      >
        認証確認を再試行
      </button>
    </>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.current.mockResolvedValue({ data: { staff } });
  mocks.login.mockResolvedValue({ data: { staff } });
});
it("期限切れ後も入力・画面を保持し、同じ担当者の再認証で戻る", async () => {
  render(
    <AuthProvider>
      <Content />
    </AuthProvider>,
  );
  await screen.findByText("authenticated");
  await act(async () => {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  });
  expect(await screen.findByRole("dialog")).toHaveTextContent(
    "セッションの再認証",
  );
  expect(screen.getByDisplayValue("未保存の予約")).toBeInTheDocument();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("パスワード"), "Password123!");
  await user.click(screen.getByRole("button", { name: "再認証して戻る" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(screen.getByLabelText("編集中の入力")).toHaveValue("未保存の予約");
  expect(mocks.login).toHaveBeenCalledWith({
    staff: { staff_id: 1, password: "Password123!" },
  });
});
it("一時障害を未認証と扱わず、再取得で復旧する", async () => {
  mocks.current.mockRejectedValueOnce(new ApiClientError("unavailable", 502));
  render(
    <AuthProvider>
      <Content />
    </AuthProvider>,
  );
  expect(await screen.findByText("error")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "認証確認を再試行" }),
  );
  expect(await screen.findByText("authenticated")).toBeInTheDocument();
});
it("ログイン後の戻り先はアプリ内の業務画面に限定する", () => {
  expect(safeReturnPath("/customers?page=2")).toBe("/customers?page=2");
  for (const value of [
    "//evil.test",
    "https://evil.test",
    "/login",
    "/api/v1/customers",
    "/customers\\evil",
  ])
    expect(safeReturnPath(value)).toBe("/dashboard");
});
