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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApiClientError } from "@/lib/api/api-client";

import { createCustomer } from "../api/customer-api";
import {
  buildCreateCustomerRequest,
  EMPTY_CUSTOMER_FORM_VALUES,
  type CustomerFormValues,
} from "../customer-form";
import { CustomerForm } from "./CustomerForm";
import { CustomerFormConfirmDialog } from "./CustomerFormConfirmDialog";

type CustomerCreateDialogProps = {
  onCompleted: () => void | Promise<void>;
};

const FORM_ID = "customer-create-form";

export function CustomerCreateDialog({
  onCompleted,
}: CustomerCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [values, setValues] = useState<CustomerFormValues>(() => ({
    ...EMPTY_CUSTOMER_FORM_VALUES,
  }));

  const [errors, setErrors] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleRequestConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setConfirmOpen(false);
    setIsSubmitting(true);
    setErrors([]);

    try {
      await createCustomer(buildCreateCustomerRequest(values));

      setOpen(false);
      setValues({
        ...EMPTY_CUSTOMER_FORM_VALUES,
      });

      await onCompleted();
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrors(error.errors.length > 0 ? error.errors : [error.message]);
      } else {
        setErrors(["顧客の登録中に予期しないエラーが発生しました。"]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setConfirmOpen(false);
      setErrors([]);
      setValues({
        ...EMPTY_CUSTOMER_FORM_VALUES,
      });
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>顧客を登録</Button>
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>顧客登録</DialogTitle>
            <DialogDescription>
              新しい顧客情報を入力してください。
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              キャンセル
            </Button>

            <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
              入力内容を確認
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomerFormConfirmDialog
        open={confirmOpen}
        mode="create"
        values={values}
        isSubmitting={isSubmitting}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          void handleConfirm();
        }}
      />
    </>
  );
}
