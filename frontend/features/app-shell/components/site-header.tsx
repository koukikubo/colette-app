"use client";

import { usePathname } from "next/navigation";

import { Brand } from "./brand";
import { SidebarTrigger } from "@/components/ui/sidebar";

type HeaderLocation = {
  section: string;
  page?: string;
};

function resolveHeaderLocation(pathname: string): HeaderLocation {
  if (pathname === "/reservations/new") {
    return { section: "予約管理", page: "新規予約登録" };
  }

  if (pathname === "/reservations/calendar") {
    return { section: "予約管理", page: "カレンダー" };
  }

  if (/^\/reservations\/(?:detail\/)?[^/]+$/.test(pathname)) {
    return { section: "予約管理", page: "予約詳細" };
  }

  if (pathname === "/reservations") {
    return { section: "予約管理", page: "タイムライン" };
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

  if (pathname === "/rf-management/new") {
    return { section: "統一RFマスタ", page: "新規登録" };
  }

  if (/^\/rf-management\/[^/]+\/edit$/.test(pathname)) {
    return { section: "統一RFマスタ", page: "設定編集" };
  }

  if (/^\/rf-management\/[^/]+$/.test(pathname)) {
    return { section: "統一RFマスタ", page: "設定詳細" };
  }

  if (pathname === "/rf-management") {
    return { section: "統一RFマスタ", page: "設定一覧" };
  }

  const pageTitles: Record<string, string> = {
    "/dashboard": "ダッシュボード",
    "/restaurant-masters": "予約テーブルマスタ",
    "/staff-masters": "担当者マスタ",
    "/standard-codes": "基本コードマスタ",
    "/rf-analysis": "統一RFランク表",
    "/rf-customer-transitions": "RFランク客層変動表",
    "/rf-customers": "RF分析の対象顧客",
    "/rf-rank-drops": "RFランク低下顧客",
    "/rf-rank-drops/predictions": "RFランク低下予定",
    "/account/password": "パスワード変更",
  };

  return { section: pageTitles[pathname] ?? "Colette" };
}

export function SiteHeader() {
  const pathname = usePathname();
  const location = resolveHeaderLocation(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center bg-card">
      <div className="flex min-w-0 w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger
          className="-ml-1"
          aria-label="メニューを開閉"
          title="メニューを開閉"
        />
        <div className="mr-2 shrink-0 sm:mr-6">
          <Brand authenticated />
        </div>
        <nav
          aria-label="現在地"
          className="flex min-w-0 items-center gap-2 text-sm sm:text-base"
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
