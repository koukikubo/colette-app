"use client";

import { ConfirmActionDialog } from "./ConfirmActionDialog";

type ConfirmDiscardChangesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

// 保存されていない入力内容を破棄してよいか確認する共通ダイアログ。
export function ConfirmDiscardChangesDialog({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmDiscardChangesDialogProps) {
  return (
    <ConfirmActionDialog
      open={open}
      title="入力内容を破棄しますか？"
      description="保存されていない変更があります。このまま移動すると、入力内容は失われます。"
      confirmLabel="破棄して移動"
      submittingLabel="移動中…"
      cancelLabel="編集を続ける"
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  );
}
