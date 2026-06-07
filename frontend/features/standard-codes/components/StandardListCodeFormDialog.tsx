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
  StandardListCode,
  StandardListCodeFormValues,
} from "@/features/standard-codes/types";

type DialogMode = "create" | "edit";

type StandardListCodeFormDialogProps = {
  open: boolean;
  mode: DialogMode;
  selectedStandardCode: StandardCode | null;
  standardListCode?: StandardListCode | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: StandardListCodeFormValues) => void | Promise<void>;
};

type StandardListCodeFormContentProps = {
  mode: DialogMode;
  selectedStandardCode: StandardCode | null;
  standardListCode?: StandardListCode | null;
  isSubmitting: boolean;
  onSubmit: (values: StandardListCodeFormValues) => void | Promise<void>;
};

function normalizeNullableText(value: string | null) {
  const trimmedValue = value?.trim() ?? "";

  return trimmedValue === "" ? null : trimmedValue;
}

function buildInitialValues(
  mode: DialogMode,
  standardListCode?: StandardListCode | null,
): StandardListCodeFormValues {
  if (mode === "edit" && standardListCode) {
    return {
      code: standardListCode.code,
      label: standardListCode.label,
      description: standardListCode.description,
      active: standardListCode.active,
    };
  }

  return {
    code: "",
    label: "",
    description: null,
    active: true,
  };
}

function StandardListCodeFormContent({
  mode,
  selectedStandardCode,
  standardListCode,
  isSubmitting,
  onSubmit,
}: StandardListCodeFormContentProps) {
  const [values, setValues] = useState<StandardListCodeFormValues>(() =>
    buildInitialValues(mode, standardListCode),
  );

  const isEditMode = mode === "edit";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      code: values.code.trim(),
      label: values.label.trim(),
      description: normalizeNullableText(values.description),
      active: values.active,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? "選択肢コードを編集" : "選択肢コードを追加"}
        </DialogTitle>
        <DialogDescription>
          {selectedStandardCode
            ? `${selectedStandardCode.name} に紐づく選択肢コードを管理します。`
            : "基本コードを選択してください。"}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-muted-foreground text-xs">対象の基本コード</p>
          <p className="text-sm font-medium">
            {selectedStandardCode ? selectedStandardCode.name : "未選択"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="standard-list-code-label">表示名</Label>
          <Input
            id="standard-list-code-label"
            value={values.label}
            disabled={isSubmitting}
            placeholder="例: 予約済"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                label: event.target.value,
              }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="standard-list-code-description">説明</Label>
          <Textarea
            id="standard-list-code-description"
            value={values.description ?? ""}
            disabled={isSubmitting}
            placeholder="例: 予約が確定している状態です。"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-1">
            <Label htmlFor="standard-list-code-active">有効</Label>
            <p className="text-muted-foreground text-xs">
              無効にすると、新規登録時の選択肢として使わない想定です。
            </p>
          </div>

          <Switch
            id="standard-list-code-active"
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
        <Button type="submit" disabled={isSubmitting || !selectedStandardCode}>
          {isSubmitting ? "保存中..." : isEditMode ? "更新" : "登録"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function StandardListCodeFormDialog({
  open,
  mode,
  selectedStandardCode,
  standardListCode,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: StandardListCodeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="sm:max-w-xl">
          <StandardListCodeFormContent
            key={`${mode}-${standardListCode?.id ?? "new"}-${
              selectedStandardCode?.code ?? "none"
            }`}
            mode={mode}
            selectedStandardCode={selectedStandardCode}
            standardListCode={standardListCode}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
