import type { ReactNode } from "react";

// 現在地は共通ヘッダーへ表示し、本文の見出し構造は読み上げ用に維持する。
export function PageHeading({ children }: { children: ReactNode }) {
  return <h1 className="sr-only">{children}</h1>;
}
