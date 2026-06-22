"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiClientError } from "@/lib/api/api-client";

import { createCustomer, updateCustomer } from "../api/customer-api";
import {
  buildCreateCustomerRequest,
  buildUpdateCustomerRequest,
  customerToFormValues,
  EMPTY_CUSTOMER_FORM_VALUES,
  type CustomerFormValues,
} from "../customer-form";
import type { Customer } from "../types";
import { CustomerForm } from "./CustomerForm";
import { CustomerFormConfirmDialog } from "./CustomerFormConfirmDialog";
import { CustomerVisibilitySection } from "./CustomerVisibilitySection";
import { CustomerVisibilityDialog } from "./CustomerVisibilityDialog";

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

  const [errors, setErrors] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = mode === "edit";

  // 非表示確認画面の状態管理
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);

  function handleRequestConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (isEdit && !customer) {
      setErrors(["編集対象の顧客情報を取得できませんでした。"]);
      setConfirmOpen(false);
      return;
    }

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

      await onCompleted();

      setConfirmOpen(false);
      setIsSubmitting(false);
      onOpenChange(false);

      await onCompleted();
    } catch (error) {
      setConfirmOpen(false);

      if (error instanceof ApiClientError) {
        setErrors(error.errors.length > 0 ? error.errors : [error.message]);
      } else {
        setErrors([
          isEdit
            ? "顧客情報の更新中に予期しないエラーが発生しました。"
            : "顧客の登録中に予期しないエラーが発生しました。",
        ]);
      }
      setIsSubmitting(false);
    }
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  }

  async function handleVisibilityCompleted() {
    setVisibilityDialogOpen(false);

    await onCompleted();

    onOpenChange(false);
  }

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
            errors={errors}
            disabled={isSubmitting}
            onChange={setValues}
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

      <CustomerFormConfirmDialog
        open={confirmOpen}
        mode={mode}
        values={values}
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
