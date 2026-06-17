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

import { resetStaffFailedAttempts } from "../api/staff-master-api";
import type { StaffMaster } from "../types";

type ResetFailedAttemptsDialogProps = {
  open: boolean;
  staffMaster: StaffMaster;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => Promise<void>;
};

export function ResetFailedAttemptsDialog({
  open,
  staffMaster,
  onOpenChange,
  onUpdated,
}: ResetFailedAttemptsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const staff = staffMaster.staff;
  const isLocked = staff?.locked ?? false;
  const failedAttempts = staff?.failed_attempts ?? 0;

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
    if (!staff || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await resetStaffFailedAttempts(staffMaster.id);
      await onUpdated();

      onOpenChange(false);
    } catch {
      setErrorMessage(
        "ログイン失敗回数をリセットできませんでした。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isLocked
              ? "アカウントロックを解除しますか？"
              : "ログイン失敗回数をリセットしますか？"}
          </AlertDialogTitle>

          <AlertDialogDescription>
            対象担当者と現在の状態を確認してください。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-md border p-4 text-sm">
          <dt className="text-muted-foreground">担当者コード</dt>
          <dd className="font-mono font-medium">{staffMaster.code}</dd>

          <dt className="text-muted-foreground">担当者名</dt>
          <dd>{staffMaster.name}</dd>

          <dt className="text-muted-foreground">現在の状態</dt>
          <dd>{isLocked ? "ロック中" : "正常"}</dd>

          <dt className="text-muted-foreground">ログイン失敗回数</dt>
          <dd>{failedAttempts}回</dd>

          <dt className="text-muted-foreground">ロック日時</dt>
          <dd>{formatDateTime(staff?.locked_at)}</dd>
        </dl>

        <p className="text-sm text-muted-foreground">
          実行すると、ログイン失敗回数を0回に戻し、
          アカウントロック状態を解除します。
          ログイン可否の設定は変更されません。
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
            disabled={
              isSubmitting || !staff || (!isLocked && failedAttempts === 0)
            }
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isSubmitting && (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            )}

            {isLocked ? "ロックを解除" : "失敗回数をリセット"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
