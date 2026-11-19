import type { Reservation } from "../types";

// 受付状態はマスタ、来店結果は記録済みの日時・取消区分を優先して表示する。
export function reservationResultLabel(reservation: Reservation): string {
  if (reservation.canceled_at) {
    return reservation.cancellation_kind === "no_show"
      ? "無断キャンセル"
      : "キャンセル";
  }
  if (reservation.completed_at) return "退店済";
  return reservation.reservation_status?.label ?? "受付状態不明";
}
