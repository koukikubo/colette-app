export type HeaderLocation = {
  section: string;
  page?: string;
};

export function resolveHeaderLocation(pathname: string): HeaderLocation {
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

const contentHeadingPages = new Set([
  "/rf-analysis",
  "/rf-management",
  "/rf-customer-transitions",
  "/rf-customers",
  "/rf-rank-drops",
  "/rf-rank-drops/predictions",
  "/account/password",
]);

// 本文が業務名または専用見出しを持つ画面では、共通側でH1を重ねない。
export function pageSuppliesHeading(pathname: string) {
  return (
    contentHeadingPages.has(pathname) ||
    /^\/customers\/[^/]+$/.test(pathname) ||
    /^\/rf-management\/[^/]+\/edit$/.test(pathname)
  );
}
