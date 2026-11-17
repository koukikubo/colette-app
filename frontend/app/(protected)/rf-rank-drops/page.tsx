// /rf-rank-dropsの入口。
// 認証は既存のprotectedレイアウトに任せ、一覧画面を表示する。

import { RfRankDropListPageClient } from "@/features/rf-rank-drops/components/RfRankDropListPageClient";

// URLに対応する一覧コンポーネントを返す。
export default function RfRankDropsPage() {
  return <RfRankDropListPageClient />;
}
