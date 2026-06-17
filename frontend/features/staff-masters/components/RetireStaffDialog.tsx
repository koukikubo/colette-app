"use client";

import { useState, type FormEvent } from "react";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { retireStaffMaster } from "../api/staff-master-api";
import type { RetireStaffMasterRequest, StaffMaster } from "../types";

type RetireStaffDialogProps = {
  open: boolean;
  staffMaster: StaffMaster;
  onOpenChange: (open: boolean) => void;
  onRetired: () => Promise<void>;
};

export function RetireStaffDialog({
  open,
  staffMaster,
  onOpenChange,
  onRetired,
}: RetireStaffDialogProps) {
  const [retiredOn, setRetiredOn] = useState(getTodayDateInputValue);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setRetiredOn(getTodayDateInputValue());
    setFieldError(null);
    setApiError(null);
    setConfirmOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    if (!nextOpen) {
      resetState();
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const error = validateRetiredOn(
      retiredOn,
      staffMaster.employment_started_on,
    );

    setFieldError(error);
    setApiError(null);

    if (error) {
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (isSubmitting) {
      return;
    }

    const error = validateRetiredOn(
      retiredOn,
      staffMaster.employment_started_on,
    );

    if (error) {
      setConfirmOpen(false);
      setFieldError(error);
      return;
    }

    const payload: RetireStaffMasterRequest = {
      staff_master: {
        retired_on: retiredOn,
      },
    };

    setIsSubmitting(true);
    setApiError(null);

    try {
      await retireStaffMaster(staffMaster.id, payload);

      setConfirmOpen(false);
      onOpenChange(false);

      await onRetired();
    } catch {
      setConfirmOpen(false);
      setApiError(
        "退職処理を実行できませんでした。入力内容を確認して再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>担当者の退職処理</DialogTitle>

            <DialogDescription>
              退職日を登録し、担当者を退職済みの状態へ変更します。
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-md border p-4 text-sm">
              <dt className="text-muted-foreground">担当者コード</dt>

              <dd className="font-mono font-medium">{staffMaster.code}</dd>

              <dt className="text-muted-foreground">担当者名</dt>

              <dd>{staffMaster.name}</dd>

              <dt className="text-muted-foreground">入社日</dt>

              <dd>{formatDate(staffMaster.employment_started_on)}</dd>
            </dl>

            <div className="space-y-2">
              <Label htmlFor="retired-on">
                退職日
                <span className="ml-1 text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>

              <Input
                id="retired-on"
                type="date"
                value={retiredOn}
                min={staffMaster.employment_started_on}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldError)}
                aria-describedby={fieldError ? "retired-on-error" : undefined}
                onChange={(event) => {
                  setRetiredOn(event.target.value);
                  setFieldError(null);
                  setApiError(null);
                }}
              />

              {fieldError && (
                <p
                  id="retired-on-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {fieldError}
                </p>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              退職後は在籍中一覧から退職者リストへ移動し、
              新規ログインができなくなります。
            </p>

            {apiError && (
              <p className="text-sm text-destructive" role="alert">
                {apiError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleOpenChange(false)}
              >
                キャンセル
              </Button>

              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                確認へ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(nextOpen) => {
          if (!isSubmitting) {
            setConfirmOpen(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              この担当者を退職扱いにしますか？
            </AlertDialogTitle>

            <AlertDialogDescription>
              登録内容を確認してください。この操作では担当者を物理削除しません。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-md border p-4 text-sm">
            <dt className="text-muted-foreground">担当者コード</dt>

            <dd className="font-mono font-medium">{staffMaster.code}</dd>

            <dt className="text-muted-foreground">担当者名</dt>

            <dd>{staffMaster.name}</dd>

            <dt className="text-muted-foreground">退職日</dt>

            <dd className="font-medium">{formatDate(retiredOn)}</dd>
          </dl>

          <p className="text-sm text-muted-foreground">
            退職後も担当者情報とログイン管理情報は保持されます。
            復帰操作によって在籍中へ戻すことができます。
          </p>

          {apiError && (
            <p className="text-sm text-destructive" role="alert">
              {apiError}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              修正に戻る
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isSubmitting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirm();
              }}
            >
              {isSubmitting && (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              )}
              退職を確定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function validateRetiredOn(retiredOn: string, employmentStartedOn: string) {
  if (!retiredOn) {
    return "退職日を入力してください。";
  }

  // YYYY-MM-DD同士なので文字列比較で日付順を判定できる
  if (retiredOn < employmentStartedOn) {
    return "退職日は入社日以降の日付を指定してください。";
  }

  return null;
}

function getTodayDateInputValue() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
