"use client";

import { useState, type FormEvent } from "react";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import type {
  StandardCode,
  StandardCodeFormValues,
  StandardCodeUsagePlace,
} from "@/features/standard-codes/types";
import { ConfirmStandardCodeSaveDialog } from "./ConfirmStandardCodeSaveDialog";

type DialogMode = "create" | "edit";

type StandardCodeFormDialogProps = {
  open: boolean;
  mode: DialogMode;
  standardCode?: StandardCode | null;
  usagePlaces?: StandardCodeUsagePlace[];
  isSubmitting?: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: StandardCodeFormValues) => void | Promise<void>;
};

type StandardCodeFormContentProps = {
  mode: DialogMode;
  standardCode?: StandardCode | null;
  usagePlaces?: StandardCodeUsagePlace[];
  errorMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (values: StandardCodeFormValues) => void | Promise<void>;
};

function normalizeNullableText(value: string | null) {
  const trimmedValue = value?.trim() ?? "";

  return trimmedValue === "" ? null : trimmedValue;
}

// 使用場所と単複選択は独立して復元し、編集開始時に既存設定を変えない。
function buildInitialValues(
  mode: DialogMode,
  standardCode?: StandardCode | null,
): StandardCodeFormValues {
  if (mode === "edit" && standardCode) {
    return {
      usage_place_id: standardCode.usage_place_id ?? null,
      input_type: standardCode.input_type ?? "single",
      input_group: standardCode.input_group ?? null,
      name: standardCode.name,
      description: standardCode.description,
      active: standardCode.active,
    };
  }

  return {
    usage_place_id: null,
    input_type: "single",
    input_group: null,
    name: "",
    description: null,
    active: true,
  };
}

function StandardCodeFormContent({
  mode,
  standardCode,
  usagePlaces = [],
  isSubmitting,
  errorMessage,
  onSubmit,
}: StandardCodeFormContentProps) {
  const [values, setValues] = useState<StandardCodeFormValues>(() =>
    buildInitialValues(mode, standardCode),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<StandardCodeFormValues | null>(null);

  const isEditMode = mode === "edit";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPendingValues({
      usage_place_id: values.usage_place_id,
      input_type: values.input_type,
      input_group: normalizeNullableText(values.input_group),
      name: values.name.trim(),
      description: normalizeNullableText(values.description),
      active: values.active,
    });
    setConfirmOpen(true);
  }

  async function handleConfirmSubmit() {
    if (!pendingValues) return;

    await onSubmit(pendingValues);

    setConfirmOpen(false);
    setPendingValues(null);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "基本コードを編集" : "基本コードを追加"}
          </DialogTitle>
          <DialogDescription>
            基本コードは、選択肢コードをまとめる親コードです。
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="standard-code-name">名称</Label>
            <Input
              id="standard-code-name"
              value={values.name}
              disabled={isSubmitting}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="standard-code-description">説明</Label>
            <Textarea
              id="standard-code-description"
              value={values.description ?? ""}
              disabled={isSubmitting}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>

          {!standardCode?.system_key && (
            <fieldset className="space-y-3 rounded-lg bg-muted/40 p-4">
              <legend className="text-sm font-medium">選択項目の設定</legend>
              <Label htmlFor="standard-code-usage-place">使用場所</Label>
              <select
                id="standard-code-usage-place"
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={values.usage_place_id ?? ""}
                disabled={isSubmitting || usagePlaces.length === 0}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    usage_place_id:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  }))
                }
              >
                <option value="">未指定</option>
                {usagePlaces.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name}
                  </option>
                ))}
                {values.usage_place_id &&
                  !usagePlaces.some(
                    (place) => place.id === values.usage_place_id,
                  ) && (
                    <option value={values.usage_place_id}>
                      {standardCode?.usage_place?.name ?? "現在の使用場所"}
                    </option>
                  )}
              </select>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {
                  usagePlaces.find(
                    (place) => place.id === values.usage_place_id,
                  )?.description
                }
              </p>
              <Label htmlFor="standard-code-customer-mode">入力方法</Label>
              <select
                id="standard-code-customer-mode"
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={values.input_type}
                disabled={isSubmitting}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    input_type: event.target.value as "single" | "multiple",
                  }))
                }
              >
                <option value="single">単一選択（プルダウン）</option>
                <option value="multiple">複数選択</option>
              </select>
              <Label htmlFor="standard-code-customer-group">分類（任意）</Label>
              <Input
                id="standard-code-customer-group"
                maxLength={50}
                placeholder="嗜好・好み、連絡・会員など"
                value={values.input_group ?? ""}
                disabled={isSubmitting}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    input_group: event.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                使用場所と入力方法を個別に設定します。使用場所の変更・解除後も顧客の保存済み回答は保持し、参照できます。
              </p>
            </fieldset>
          )}

          {standardCode?.system_key && (
            <p className="rounded-lg bg-muted/40 p-3 text-sm">
              システム用（用途固定）
            </p>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-1">
              <Label htmlFor="standard-code-active">有効</Label>
              <p className="text-muted-foreground text-xs">
                無効にすると、新規登録時の選択肢として使わない想定です。
              </p>
            </div>

            <Switch
              id="standard-code-active"
              checked={values.active}
              disabled={isSubmitting}
              onCheckedChange={(checked) =>
                setValues((current) => ({
                  ...current,
                  active: checked,
                }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : isEditMode ? "更新" : "登録"}
          </Button>
        </DialogFooter>
      </form>

      <ConfirmStandardCodeSaveDialog
        open={confirmOpen}
        mode={mode}
        standardCode={standardCode}
        pendingValues={pendingValues}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setConfirmOpen(open);

          if (!open) {
            setPendingValues(null);
          }
        }}
        onConfirm={handleConfirmSubmit}
      />
    </>
  );
}

export function StandardCodeFormDialog({
  open,
  mode,
  standardCode,
  usagePlaces,
  isSubmitting = false,
  errorMessage,
  onOpenChange,
  onSubmit,
}: StandardCodeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="sm:max-w-xl">
          <StandardCodeFormContent
            key={`${mode}-${standardCode?.id ?? "new"}`}
            mode={mode}
            standardCode={standardCode}
            usagePlaces={usagePlaces}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            onSubmit={onSubmit}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
