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

import type { StandardListCode } from "@/features/standard-codes/types";

type DisableStandardListCodeDialogProps = {
  open: boolean;
  standardListCode: StandardListCode | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function DisableStandardListCodeDialog({
  open,
  standardListCode,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: DisableStandardListCodeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>選択肢コードを無効化しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {standardListCode
              ? `「${standardListCode.label}」を無効化します。無効化すると、新規登録時の選択肢として使用しない想定です。既存データとの紐づきは保持されます。`
              : "選択された選択肢コードを無効化します。"}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            キャンセル
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting || !standardListCode}
              onClick={() => {
                void onConfirm();
              }}
            >
              {isSubmitting ? "無効化中..." : "無効化する"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
