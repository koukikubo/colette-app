import type { RfCalculationStatus, RfRuleSetStatus } from "./types";

export const RF_CALCULATION_STATUS_LABELS = {
  pending: "実行待ち",
  processing: "計算中",
  completed: "計算完了",
  failed: "失敗",
} satisfies Record<RfCalculationStatus, string>;

export const RF_RULE_SET_STATUS_LABELS = {
  draft: "下書き",
  published: "公開中",
  archived: "アーカイブ済み",
} satisfies Record<RfRuleSetStatus, string>;
