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

import type { StandardCode } from "@/features/standard-codes/types";

type DisableStandardCodeDialogProps = {
  open: boolean;
  standardCode: StandardCode | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function DisableStandardCodeDialog({
  open,
  standardCode,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: DisableStandardCodeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>基本コードを無効化しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {standardCode
              ? `「${standardCode.name}」を無効化します。無効化すると、新規登録時の選択肢として使用しない想定です。既存データとの紐づきは保持されます。`
              : "選択された基本コードを無効化します。"}
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
              disabled={isSubmitting || !standardCode}
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
