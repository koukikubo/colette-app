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

import { updateStaffLoginEnabled } from "../api/staff-master-api";
import type { StaffMaster } from "../types";

type ToggleLoginEnabledDialogProps = {
  open: boolean;
  staffMaster: StaffMaster;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => Promise<void>;
};

export function ToggleLoginEnabledDialog({
  open,
  staffMaster,
  onOpenChange,
  onUpdated,
}: ToggleLoginEnabledDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const staff = staffMaster.staff;
  const currentLoginEnabled = staff?.login_enabled ?? false;
  const nextLoginEnabled = !currentLoginEnabled;

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
      await updateStaffLoginEnabled(staffMaster.id, nextLoginEnabled);

      await onUpdated();
      onOpenChange(false);
    } catch {
      setErrorMessage(
        "ログイン可否を変更できませんでした。時間をおいて再度お試しください。",
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
            ログインを
            {nextLoginEnabled ? "有効" : "無効"}
            にしますか？
          </AlertDialogTitle>

          <AlertDialogDescription>
            対象担当者と変更内容を確認してください。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-md border p-4 text-sm">
          <dt className="text-muted-foreground">担当者コード</dt>
          <dd className="font-mono font-medium">{staffMaster.code}</dd>

          <dt className="text-muted-foreground">担当者名</dt>
          <dd>{staffMaster.name}</dd>

          <dt className="text-muted-foreground">現在の設定</dt>
          <dd>{currentLoginEnabled ? "ログイン有効" : "ログイン無効"}</dd>

          <dt className="text-muted-foreground">変更後</dt>
          <dd className="font-medium">
            {nextLoginEnabled ? "ログイン有効" : "ログイン無効"}
          </dd>
        </dl>

        {!nextLoginEnabled && (
          <p className="text-sm text-muted-foreground">
            無効化後、この担当者はログインできなくなります。
            現在のセッションを即時終了する処理は含まれません。
          </p>
        )}

        {nextLoginEnabled && staff?.locked && (
          <p className="text-sm text-destructive">
            この担当者はアカウントロック中です。
            ログインを有効にしても、ロックを解除するまではログインできません。
          </p>
        )}

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
            disabled={isSubmitting || !staff}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isSubmitting && (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            )}

            {nextLoginEnabled ? "ログインを有効にする" : "ログインを無効にする"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
