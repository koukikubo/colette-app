import type { RfCalculationStatus } from "./types";

export const RF_CALCULATION_STATUS_LABELS = {
  pending: "実行待ち",
  processing: "計算中",
  completed: "計算完了",
  failed: "失敗",
} satisfies Record<RfCalculationStatus, string>;
