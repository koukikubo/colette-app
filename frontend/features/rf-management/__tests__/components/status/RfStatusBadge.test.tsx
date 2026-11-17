import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  RfCalculationStatusBadge,
  RfCurrentStatusBadge,
  RfRuleSetStatusBadge,
} from "../../../components/status/RfStatusBadge";

describe("RfStatusBadge", () => {
  it.each([
    ["pending", "実行待ち", "bg-amber-50"],
    ["processing", "計算中", "bg-blue-50"],
    ["completed", "計算完了", "bg-emerald-50"],
    ["failed", "失敗", "bg-red-50"],
  ] as const)("計算ステータス%sに固定色を表示する", (status, label, color) => {
    render(<RfCalculationStatusBadge status={status} />);

    expect(screen.getByText(label)).toHaveClass(color);
  });

  it.each([
    ["draft", "下書き", "bg-slate-100"],
    ["published", "公開中", "bg-teal-50"],
    ["archived", "アーカイブ済み", "bg-orange-50"],
  ] as const)(
    "ルールステータス%sに固定色を表示する",
    (status, label, color) => {
      render(<RfRuleSetStatusBadge status={status} />);

      expect(screen.getByText(label)).toHaveClass(color);
    },
  );

  it("現在適用中を濃い緑色で表示する", () => {
    render(<RfCurrentStatusBadge />);

    expect(screen.getByText("現在適用中")).toHaveClass("bg-green-700");
  });
});
