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
      ["統一RFマスタ", "/rf-management"],
    ];

    expectedLinks.forEach(([name, href]) => {
      expect(
        screen.getByRole("link", {
          name,
        }),
      ).toHaveAttribute("href", href);
    });

    expect(screen.getByText("メインメニュー")).toBeInTheDocument();
    expect(screen.queryByText("お知らせ")).not.toBeInTheDocument();
    expect(screen.queryByText("顧客ノート")).not.toBeInTheDocument();
  });

  it("管理メニューへのリンクを表示する", () => {
    renderAppSidebar();

    expect(screen.getByText("管理メニュー")).toBeInTheDocument();

    const expectedLinks = [
      ["基本コードマスタ", "/standard-codes"],
      ["担当者マスタ", "/staff-masters"],
      ["予約テーブルマスタ", "/restaurant-masters"],
      ["統一RFマスタ", "/rf-management"],
    ];

    expectedLinks.forEach(([name, href]) => {
      expect(
        screen.getByRole("link", {
          name,
        }),
      ).toHaveAttribute("href", href);
    });
  });

  it("不要な検索メニューを表示しない", () => {
    renderAppSidebar();

    expect(screen.queryByText("検索メニュー")).not.toBeInTheDocument();
    expect(screen.queryByText("顧客検索")).not.toBeInTheDocument();
    expect(screen.queryByText("予約検索")).not.toBeInTheDocument();
  });

  it("担当者メニューを表示する", () => {
    renderAppSidebar();

    expect(screen.getByText("担当者メニュー")).toBeInTheDocument();
  });
});
