"use client";

import { type FormEvent, useState, useEffect, useRef } from "react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiClientError } from "@/lib/api/api-client";

import { createCustomer, updateCustomer } from "../../api/customer-api";
import {
  buildCreateCustomerRequest,
  buildUpdateCustomerRequest,
  customerToFormValues,
  EMPTY_CUSTOMER_FORM_VALUES,
  type CustomerFormValues,
} from "../../customer-form";
import type { Customer } from "../../types";
import { CustomerForm } from "../form/CustomerForm";
import { CustomerFormConfirmDialog } from "./CustomerFormConfirmDialog";
import { CustomerVisibilitySection } from "../form/CustomerVisibilitySection";
import { CustomerVisibilityDialog } from "./CustomerVisibilityDialog";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { validateCustomerFormValues } from "../../utils/customer-form-validation";
import { fetchStandardCodes } from "@/features/standard-codes/api/standard-code-api";
import type { StandardListCode } from "@/features/standard-codes/types";

export type CustomerFormMode = "create" | "edit";

type CustomerFormDialogProps = {
  open: boolean;
  mode: CustomerFormMode;
  customer: Customer | null;
  allowVisibilityChange: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void | Promise<void>;
};

const FORM_ID = "customer-form";

function createInitialFormValues(
  mode: CustomerFormMode,
  customer: Customer | null,
): CustomerFormValues {
  if (mode === "edit" && customer) {
    return customerToFormValues(customer);
  }

  return {
    ...EMPTY_CUSTOMER_FORM_VALUES,
  };
}

export function CustomerFormDialog({
  open,
  mode,
  customer,
  onOpenChange,
  onCompleted,
  allowVisibilityChange,
}: CustomerFormDialogProps) {
  const [values, setValues] = useState<CustomerFormValues>(() =>
    createInitialFormValues(mode, customer),
  );
  const initialValues = useRef(values);
  const hasUnsavedChanges =
    JSON.stringify(values) !== JSON.stringify(initialValues.current);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [customerRankOptions, setCustomerRankOptions] = useState<
    StandardListCode[]
  >([]);

  const [isCustomerRankLoading, setIsCustomerRankLoading] = useState(false);

  const [saved, setSaved] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const saving = useRef(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = mode === "edit";
  const { fieldErrors, setFieldErrors, clearFieldError, clearAllFieldErrors } =
    useFieldErrors();

  useEffect(() => {
    if (!open || !hasUnsavedChanges || saved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [open, hasUnsavedChanges, saved]);

  // 非表示確認画面の状態管理
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();

    async function loadCustomerRankOptions() {
      setIsCustomerRankLoading(true);

      try {
        const response = await fetchStandardCodes(controller.signal);

        const customerRankMaster = response.data.standard_masters.find(
          (standardMaster) => standardMaster.system_key === "customer_rank",
        );

        const currentCustomerRankId = customer?.customer_rank_id ?? null;

        const selectableOptions =
          customerRankMaster?.items?.filter(
            (option) => option.active || option.id === currentCustomerRankId,
          ) ?? [];

        setCustomerRankOptions(selectableOptions);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("顧客ランクの取得に失敗しました。", error);

        setErrors(["顧客ランクの選択肢を取得できませんでした。"]);
      } finally {
        if (!controller.signal.aborted) {
          setIsCustomerRankLoading(false);
        }
      }
    }

    void loadCustomerRankOptions();

    return () => {
      controller.abort();
    };
  }, [open, customer?.customer_rank_id]);

  function handleRequestConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    clearAllFieldErrors();

    const validationErrors = validateCustomerFormValues(values);

    // 入力エラーがある場合は、確認ダイアログを開かずフォーム上に表示する。
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setErrors(["赤字で表示された項目を修正してください。"]);
      return;
    }

    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (saving.current || saved) return;
    if (isEdit && !customer) {
      setErrors(["編集対象の顧客情報を取得できませんでした。"]);
      setConfirmOpen(false);
      return;
    }

    saving.current = true;
    setIsSubmitting(true);
    setErrors([]);

    try {
      if (isEdit && customer) {
        await updateCustomer(
          customer.id,
          buildUpdateCustomerRequest(values, customer.lock_version),
        );
      } else {
        await createCustomer(buildCreateCustomerRequest(values));
      }

      // 保存の確定と、表示更新の失敗を別の状態として扱う。
      setSaved(true);
      setConfirmOpen(false);
      await refreshAfterSave();
    } catch (error) {
      setConfirmOpen(false);

      if (error instanceof ApiClientError) {
        if (error.status === 422 && !Array.isArray(error.errors)) {
          setFieldErrors(error.errors);
          setErrors([error.message]);
        } else {
          setErrors(
            error.errorMessages.length > 0
              ? error.errorMessages
              : [error.message],
          );
        }
      } else {
        setErrors([
          isEdit
            ? "顧客情報の更新中に予期しないエラーが発生しました。"
            : "顧客の登録中に予期しないエラーが発生しました。",
        ]);
      }
    } finally {
      saving.current = false;
      setIsSubmitting(false);
    }
  }

  async function refreshAfterSave() {
    setIsSubmitting(true);
    setRefreshFailed(false);
    try {
      await onCompleted();
      setSaved(false);
      onOpenChange(false);
    } catch {
      setRefreshFailed(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }

    if (!nextOpen && hasUnsavedChanges) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(nextOpen);
  }

  async function handleVisibilityCompleted() {
    setVisibilityDialogOpen(false);

    await onCompleted();

    onOpenChange(false);
  }

  const selectedCustomerRank = customerRankOptions.find(
    (option) => option.id === values.customerRankId,
  );

  const selectedCustomerRankLabel = selectedCustomerRank
    ? `${selectedCustomerRank.label}${
        selectedCustomerRank.active ? "" : "（無効・現在設定中）"
      }`
    : null;

  if (saved)
    return (
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !isSubmitting) {
            setSaved(false);
            onOpenChange(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>顧客情報は保存済みです</DialogTitle>
            <DialogDescription>登録し直す必要はありません。</DialogDescription>
          </DialogHeader>
          {refreshFailed && (
            <p role="alert">
              保存は完了しましたが、表示を更新できませんでした。
            </p>
          )}
          <Button
            disabled={isSubmitting}
            onClick={() => void refreshAfterSave()}
          >
            表示を再取得
          </Button>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => {
              setSaved(false);
              onOpenChange(false);
            }}
          >
            閉じる
          </Button>
        </DialogContent>
      </Dialog>
    );

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "顧客情報を編集" : "顧客を登録"}
            </DialogTitle>

            <DialogDescription>
              {isEdit
                ? "登録されている顧客情報を変更します。"
                : "新しい顧客情報を入力します。"}
            </DialogDescription>
          </DialogHeader>

          <CustomerForm
            formId={FORM_ID}
            values={values}
            customerRankOptions={customerRankOptions}
            isCustomerRankLoading={isCustomerRankLoading}
            errors={errors}
            fieldErrors={fieldErrors}
            disabled={isSubmitting}
            onChange={setValues}
            onClearFieldError={clearFieldError}
            onSubmit={handleRequestConfirm}
          />

          {isEdit && customer && (
            <CustomerVisibilitySection
              customer={customer}
              allowVisibilityChange={allowVisibilityChange}
              disabled={isSubmitting}
              onRequestChange={() => setVisibilityDialogOpen(true)}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleDialogOpenChange(false)}
            >
              キャンセル
            </Button>

            <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
              {isEdit ? "更新内容を確認" : "登録内容を確認"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>入力内容を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              変更内容はまだ保存されていません。破棄すると元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>編集を続ける</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscardOpen(false);
                onOpenChange(false);
              }}
            >
              入力内容を破棄する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CustomerFormConfirmDialog
        open={confirmOpen}
        mode={mode}
        values={values}
        customerRankLabel={selectedCustomerRankLabel}
        isSubmitting={isSubmitting}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          void handleConfirm();
        }}
      />

      {customer && (
        <CustomerVisibilityDialog
          open={visibilityDialogOpen}
          customer={customer}
          onOpenChange={setVisibilityDialogOpen}
          onCompleted={handleVisibilityCompleted}
          onError={setErrors}
        />
      )}
    </>
  );
}
