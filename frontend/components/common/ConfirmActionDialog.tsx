"use client";

import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmActionDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  submittingLabel: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  children?: ReactNode;
  confirmDisabled?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

// 登録・更新などの実行前に、利用者へ最終確認する共通ダイアログ。
export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  submittingLabel,
  cancelLabel = "戻って修正する",
  isSubmitting = false,
  children,
  confirmDisabled = false,
  onOpenChange,
  onConfirm,
}: ConfirmActionDialogProps) {
  function handleOpenChange(nextOpen: boolean) {
    // 通信中にダイアログを閉じ、処理状況が分からなくなることを防ぐ。
    if (isSubmitting) return;

    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>

          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            {cancelLabel}
          </AlertDialogCancel>

          <Button
            type="button"
            disabled={isSubmitting || confirmDisabled}
            onClick={() => {
              void onConfirm();
            }}
          >
            {isSubmitting ? submittingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
