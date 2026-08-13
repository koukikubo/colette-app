"use client";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";

type ReservationUpdateConfirmDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

// 予約更新時の文言を共通確認ダイアログへ設定する。
export function ReservationUpdateConfirmDialog({
  open,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: ReservationUpdateConfirmDialogProps) {
  return (
    <ConfirmActionDialog
      open={open}
      title="予約内容を更新しますか？"
      description="入力内容を確認してから更新してください。"
      confirmLabel="更新する"
      submittingLabel="更新中…"
      isSubmitting={isSubmitting}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  );
}
