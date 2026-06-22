"use client";

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

import type { CustomerFormValues } from "../customer-form";

type CustomerFormConfirmDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  values: CustomerFormValues;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

// 顧客登録前に内容を確認するためのダイアログ
export function CustomerFormConfirmDialog({
  open,
  mode,
  values,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: CustomerFormConfirmDialogProps) {
  const isCreate = mode === "create";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCreate
              ? "この内容で顧客を登録しますか？"
              : "この内容で顧客情報を更新しますか？"}
          </AlertDialogTitle>

          <AlertDialogDescription>
            内容を確認してから実行してください。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border p-4 text-sm">
          <dt className="text-muted-foreground">顧客区分</dt>
          <dd>{values.customerKind === "individual" ? "個人" : "法人"}</dd>

          <dt className="text-muted-foreground">顧客名</dt>
          <dd>{values.name || "-"}</dd>

          <dt className="text-muted-foreground">フリガナ</dt>
          <dd>{values.kana || "-"}</dd>

          <dt className="text-muted-foreground">電話番号</dt>
          <dd>{values.phoneNumber || "-"}</dd>

          <dt className="text-muted-foreground">メール</dt>
          <dd>{values.email || "-"}</dd>

          {values.customerKind === "corporate" && (
            <>
              <dt className="text-muted-foreground">法人名</dt>
              <dd>{values.companyName || "-"}</dd>
            </>
          )}
        </dl>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            戻って修正する
          </AlertDialogCancel>

          <Button type="button" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting
              ? isCreate
                ? "登録中..."
                : "更新中..."
              : isCreate
                ? "登録する"
                : "更新する"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
