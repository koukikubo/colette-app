"use client";

import { useState } from "react";

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
import { ApiClientError } from "@/lib/api/api-client";

import { hideCustomer, restoreCustomer } from "../api/customer-api";
import type { Customer } from "../types";

type CustomerVisibilityDialogProps = {
  open: boolean;
  customer: Customer;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void | Promise<void>;
  onError: (errors: string[]) => void;
};

// 顧客の非表示確認画面
export function CustomerVisibilityDialog({
  open,
  customer,
  onOpenChange,
  onCompleted,
  onError,
}: CustomerVisibilityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHidden = customer.hidden;

  async function handleConfirm() {
    setIsSubmitting(true);
    onError([]);

    try {
      const request = {
        customer: {
          lock_version: customer.lock_version,
        },
      };

      if (isHidden) {
        await restoreCustomer(customer.id, request);
      } else {
        await hideCustomer(customer.id, request);
      }

      onOpenChange(false);
      await onCompleted();
    } catch (error) {
      onOpenChange(false);

      if (error instanceof ApiClientError) {
        if (error.status === 409) {
          onError([
            "他の担当者によって顧客情報が更新されています。最新情報を読み込み直して、もう一度お試しください。",
          ]);
          return;
        }

        onError(error.errors.length > 0 ? error.errors : [error.message]);

        return;
      }

      onError([
        isHidden
          ? "顧客の復帰中に予期しないエラーが発生しました。"
          : "顧客の非表示処理中に予期しないエラーが発生しました。",
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isHidden ? "顧客を復帰しますか？" : "顧客を非表示にしますか？"}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {isHidden
              ? `${customer.name}を通常の顧客一覧へ復帰します。`
              : `${customer.name}を通常の顧客一覧から非表示にします。顧客情報は削除されません。`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            キャンセル
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={isSubmitting}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isSubmitting
              ? "処理中..."
              : isHidden
                ? "復帰する"
                : "非表示にする"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
