"use client";

import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type HeaderLocation = {
  section: string;
  page?: string;
};

function resolveHeaderLocation(pathname: string): HeaderLocation {
  if (pathname === "/reservations/new") {
    return { section: "予約管理", page: "新規予約登録" };
  }

  if (/^\/reservations\/[^/]+$/.test(pathname)) {
    return { section: "予約管理", page: "予約詳細" };
  }

  if (pathname === "/reservations") {
    return { section: "予約管理", page: "予約一覧" };
  }

  if (/^\/customers\/[^/]+$/.test(pathname)) {
    return { section: "顧客管理", page: "顧客詳細" };
  }

  if (pathname === "/customers") {
    return { section: "顧客管理", page: "顧客一覧" };
  }

  if (/^\/reservations\/[^/]+\/edit$/.test(pathname)) {
    return { section: "予約管理", page: "予約編集" };
  }

  const pageTitles: Record<string, string> = {
    "/dashboard": "ダッシュボード",
    "/restaurant-masters": "予約テーブルマスタ",
    "/staff-masters": "担当者マスタ",
    "/standard-codes": "基本コード・選択肢コード",
  };

  return { section: pageTitles[pathname] ?? "Colette" };
}

export function SiteHeader() {
  const pathname = usePathname();
  const location = resolveHeaderLocation(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex min-w-0 w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <nav
          aria-label="現在地"
          className="flex min-w-0 items-center gap-2 text-sm"
        >
          <span className="shrink-0 text-muted-foreground">
            {location.section}
          </span>
          {location.page && (
            <>
              <span className="text-muted-foreground/60" aria-hidden="true">
                /
              </span>
              <span className="truncate font-medium">{location.page}</span>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
