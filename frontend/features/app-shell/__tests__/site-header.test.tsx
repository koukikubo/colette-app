import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "../components/site-header";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

describe("SiteHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("予約一覧では、予約管理と予約一覧を現在地として表示する", () => {
    mocks.usePathname.mockReturnValue("/reservations");

    render(
      <SidebarProvider>
        <SiteHeader />
      </SidebarProvider>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "現在地",
    });

    expect(navigation).toHaveTextContent("予約管理");
    expect(navigation).toHaveTextContent("予約一覧");
  });

  it.each([
    ["/reservations/new", "予約管理", "新規予約登録"],
    ["/reservations/30", "予約管理", "予約詳細"],
    ["/reservations/30/edit", "予約管理", "予約編集"],
    ["/customers", "顧客管理", "顧客一覧"],
    ["/customers/10", "顧客管理", "顧客詳細"],
  ])("%sでは、%sと%sを現在地として表示する", (pathname, section, page) => {
    mocks.usePathname.mockReturnValue(pathname);

    render(
      <SidebarProvider>
        <SiteHeader />
      </SidebarProvider>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "現在地",
    });

    expect(within(navigation).getByText(section)).toBeInTheDocument();
    expect(within(navigation).getByText(page)).toBeInTheDocument();
  });

  it.each([
    ["/dashboard", "ダッシュボード"],
    ["/restaurant-masters", "予約テーブルマスタ"],
    ["/staff-masters", "担当者マスタ"],
    ["/standard-codes", "基本コード・選択肢コード"],
  ])("%sでは、%sを現在地として表示する", (pathname, section) => {
    mocks.usePathname.mockReturnValue(pathname);

    render(
      <SidebarProvider>
        <SiteHeader />
      </SidebarProvider>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "現在地",
    });

    expect(within(navigation).getByText(section)).toBeInTheDocument();
  });

  it("未定義のURLでは、Coletteを現在地として表示する", () => {
    mocks.usePathname.mockReturnValue("/unknown-page");

    render(
      <SidebarProvider>
        <SiteHeader />
      </SidebarProvider>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "現在地",
    });

    expect(within(navigation).getByText("Colette")).toBeInTheDocument();
  });
});
