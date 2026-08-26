"use client";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";

type ReservationOverlapDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewReservations: () => void | Promise<void>;
};

// 同一顧客の予約重複を知らせ、入力へ戻るか予約一覧を確認するか選択してもらう。
export function ReservationOverlapDialog({
  open,
  onOpenChange,
  onViewReservations,
}: ReservationOverlapDialogProps) {
  return (
    <ConfirmActionDialog
      open={open}
      title="予約が重複しています"
      description="同じ顧客の予約が先に登録または更新されました。予約一覧で最新の予約を確認し、既存の予約を編集してください。"
      cancelLabel="入力に戻る"
      confirmLabel="予約一覧を確認する"
      submittingLabel="予約一覧へ移動中…"
      onOpenChange={onOpenChange}
      onConfirm={onViewReservations}
    />
  );
}
