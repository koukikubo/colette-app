"use client";

import { useState } from "react";

import { Loader2Icon } from "lucide-react";

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

import { restoreStaffMaster } from "../api/staff-master-api";
import type { StaffMaster } from "../types";

type RestoreStaffDialogProps = {
  open: boolean;
  staffMaster: StaffMaster;
  onOpenChange: (open: boolean) => void;
  onRestored: () => Promise<void>;
};

export function RestoreStaffDialog({
  open,
  staffMaster,
  onOpenChange,
  onRestored,
}: RestoreStaffDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    if (!nextOpen) {
      setErrorMessage(null);
    }

    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (isSubmitting || staffMaster.retired_on === null) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await restoreStaffMaster(staffMaster.id);
      await onRestored();

      onOpenChange(false);
    } catch {
      setErrorMessage(
        "担当者を復帰できませんでした。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>この担当者を在籍中へ戻しますか？</AlertDialogTitle>

          <AlertDialogDescription>
            対象担当者と現在の退職情報を確認してください。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-md border p-4 text-sm">
          <dt className="text-muted-foreground">担当者コード</dt>
          <dd className="font-mono font-medium">{staffMaster.code}</dd>

          <dt className="text-muted-foreground">担当者名</dt>
          <dd>{staffMaster.name}</dd>

          <dt className="text-muted-foreground">入社日</dt>
          <dd>{formatDate(staffMaster.employment_started_on)}</dd>

          <dt className="text-muted-foreground">退職日</dt>
          <dd className="font-medium">{formatDate(staffMaster.retired_on)}</dd>

          <dt className="text-muted-foreground">ログイン設定</dt>
          <dd>
            {staffMaster.staff
              ? staffMaster.staff.login_enabled
                ? "有効"
                : "無効"
              : "ログイン情報未登録"}
          </dd>
        </dl>

        <p className="text-sm text-muted-foreground">
          復帰後も、現在のログイン可否・失敗回数・ロック状態は維持されます。
          必要な場合は復帰後に個別に変更してください。
        </p>

        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            キャンセル
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={isSubmitting || staffMaster.retired_on === null}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isSubmitting && (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            )}
            復帰を確定
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
