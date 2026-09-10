import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CurrentStaffDisplay } from "../components/session/CurrentStaffDisplay";
import { LogoutButton } from "../components/session/LogoutButton";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/features/staff-auth/hooks/use-auth", () => ({
  useAuth: mocks.useAuth,
}));

describe("認証セッション表示", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("確認中は読み込み表示にする", () => {
    mocks.useAuth.mockReturnValue({ status: "loading", staff: null });
    render(<CurrentStaffDisplay />);
    expect(screen.getByText("確認中...")).toBeInTheDocument();
  });

  it("認証済みなら担当者名を表示する", () => {
    mocks.useAuth.mockReturnValue({
      status: "authenticated",
      staff: { staff_master: { name: "店主" } },
    });
    render(<CurrentStaffDisplay />);
    expect(screen.getByText("店主")).toBeInTheDocument();
  });

  it("未認証なら担当者名とログアウトボタンを表示しない", () => {
    mocks.useAuth.mockReturnValue({ status: "unauthenticated", staff: null });
    const { container } = render(
      <>
        <CurrentStaffDisplay />
        <LogoutButton />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("ログアウト中はボタンを無効にして二重実行を防ぐ", async () => {
    const user = userEvent.setup();
    mocks.logout.mockReturnValue(new Promise(() => {}));
    mocks.useAuth.mockReturnValue({
      status: "authenticated",
      staff: { staff_master: { name: "店主" } },
      logout: mocks.logout,
    });

    render(<LogoutButton />);
    await user.click(screen.getByRole("button", { name: "ログアウト" }));

    const button = screen.getByRole("button", { name: "ログアウト中..." });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(mocks.logout).toHaveBeenCalledOnce();
  });
});
