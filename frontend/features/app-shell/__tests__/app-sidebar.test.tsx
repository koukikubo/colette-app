import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "../components/app-sidebar";

vi.mock("../components/navigation/nav-user", () => ({
  NavUser: () => <div>担当者メニュー</div>,
}));

function renderAppSidebar() {
  return render(
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </TooltipProvider>,
  );
}

describe("AppSidebar", () => {
  it("主要画面へのリンクを表示する", () => {
    renderAppSidebar();

    const expectedLinks = [
      ["Colette", "/dashboard"],
      ["ダッシュボード", "/dashboard"],
      ["顧客管理", "/customers"],
      ["予約管理", "/reservations"],
      ["お知らせ", "/announcements"],
      ["顧客ノート", "/customer-notes"],
    ];

    expectedLinks.forEach(([name, href]) => {
      expect(
        screen.getByRole("link", {
          name,
        }),
      ).toHaveAttribute("href", href);
    });
  });

  it("管理メニューへのリンクを表示する", () => {
    renderAppSidebar();

    expect(screen.getByText("管理メニュー")).toBeInTheDocument();

    const expectedLinks = [
      ["基本コード・選択肢コード", "/standard-codes"],
      ["担当者マスタ", "/staff-masters"],
      ["予約テーブルマスタ", "/restaurant-masters"],
    ];

    expectedLinks.forEach(([name, href]) => {
      expect(
        screen.getByRole("link", {
          name,
        }),
      ).toHaveAttribute("href", href);
    });
  });

  it("検索メニューへのリンクを表示する", () => {
    renderAppSidebar();

    expect(screen.getByText("検索メニュー")).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "顧客検索",
      }),
    ).toHaveAttribute("href", "/customers/search");

    expect(
      screen.getByRole("link", {
        name: "予約検索",
      }),
    ).toHaveAttribute("href", "/reservations/search");
  });

  it("担当者メニューを表示する", () => {
    renderAppSidebar();

    expect(screen.getByText("担当者メニュー")).toBeInTheDocument();
  });
});
