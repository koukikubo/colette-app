"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type {
  StandardListCode,
  StandardListCodeFormValues,
} from "@/features/standard-codes/types";

type DialogMode = "create" | "edit";

type ConfirmStandardListCodeSaveDialogProps = {
  open: boolean;
  mode: DialogMode;
  standardListCode?: StandardListCode | null;
  pendingValues: StandardListCodeFormValues | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmStandardListCodeSaveDialog({
  open,
  mode,
  standardListCode,
  pendingValues,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: ConfirmStandardListCodeSaveDialogProps) {
  const isEditMode = mode === "edit";

  const activeChanged =
    isEditMode &&
    standardListCode &&
    pendingValues &&
    standardListCode.active !== pendingValues.active;

  const description = (() => {
    if (activeChanged && pendingValues?.active) {
      return `「${standardListCode.label}」を有効にして保存します。有効化すると、新規登録時の選択肢として利用できる想定です。`;
    }

    if (activeChanged && pendingValues && !pendingValues.active) {
      return `「${standardListCode.label}」を無効にして保存します。無効化すると、新規登録時の選択肢として使用しない想定です。既存データとの紐づきは保持されます。`;
    }

    if (isEditMode && standardListCode) {
      return `「${standardListCode.label}」の入力内容を保存します。`;
    }

    return "入力内容を登録します。";
  })();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isEditMode
              ? "選択肢コードを更新しますか？"
              : "選択肢コードを登録しますか？"}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            キャンセル
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button
              type="button"
              disabled={isSubmitting || !pendingValues}
              onClick={() => {
                void onConfirm();
              }}
            >
              {isSubmitting ? "保存中..." : "保存する"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
