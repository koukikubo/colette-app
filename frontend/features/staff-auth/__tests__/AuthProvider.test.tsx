import { act, render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";

import { AuthContext, AuthProvider } from "../providers/AuthProvider";

const mocks = vi.hoisted(() => ({
  fetchCurrentStaff: vi.fn(),
  logoutStaff: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("../api/staff-auth-api", () => ({
  fetchCurrentStaff: mocks.fetchCurrentStaff,
  logoutStaff: mocks.logoutStaff,
}));

function AuthConsumer() {
  const auth = useContext(AuthContext);

  if (!auth) return null;

  return (
    <div>
      <span>{auth.status}</span>
      <span>{auth.staff?.staff_master.name ?? "担当者なし"}</span>
      <button type="button" onClick={() => void auth.refreshCurrentStaff()}>
        再取得
      </button>
      <button type="button" onClick={() => void auth.logout()}>
        ログアウト
      </button>
    </div>
  );
}

const staff = {
  id: 1,
  staff_master_id: 10,
  login_id: "owner",
  staff_master: {
    id: 10,
    code: "001",
    name: "店主",
    kana: "テンシュ",
  },
};

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期表示で現在の担当者を取得して認証済みにする", async () => {
    mocks.fetchCurrentStaff.mockResolvedValue({ data: { staff } });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(screen.getByText("店主")).toBeInTheDocument();
  });

  it("401の場合は未認証にする", async () => {
    mocks.fetchCurrentStaff.mockRejectedValue(
      new ApiClientError("認証が必要です。", 401),
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
    expect(screen.getByText("担当者なし")).toBeInTheDocument();
  });

  it("ログアウト後は未認証にしてログインへ戻す", async () => {
    mocks.fetchCurrentStaff.mockResolvedValue({ data: { staff } });
    mocks.logoutStaff.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await screen.findByText("authenticated");

    await act(async () => {
      screen.getByRole("button", { name: "ログアウト" }).click();
    });

    await waitFor(() => {
      expect(screen.getByText("unauthenticated")).toBeInTheDocument();
    });
    expect(mocks.logoutStaff).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledWith("/login");
  });
});
