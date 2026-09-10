import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "@/components/ui/sidebar";
import { NavUser } from "../components/navigation/nav-user";

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
}));

vi.mock("@/features/staff-auth/hooks/use-auth", () => ({
  useAuth: () => ({
    status: "authenticated",
    staff: {
      staff_master: {
        id: 1,
        code: "00001",
        name: "店主",
      },
    },
    logout: mocks.logout,
  }),
}));

describe("NavUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logout.mockResolvedValue(undefined);
  });

  it("ログイン中の担当者名を表示する", () => {
    render(
      <SidebarProvider>
        <NavUser
          user={{
            name: "User Name",
            email: "user@example.com",
            avatar: "",
          }}
        />
      </SidebarProvider>,
    );

    expect(screen.getByText("店主")).toBeInTheDocument();
  });

  it("担当者メニューからログアウトできる", async () => {
    const user = userEvent.setup();

    render(
      <SidebarProvider>
        <NavUser
          user={{
            name: "User Name",
            email: "user@example.com",
            avatar: "",
          }}
        />
      </SidebarProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: /店主/,
      }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "ログアウト",
      }),
    );

    expect(mocks.logout).toHaveBeenCalledOnce();
  });
});
