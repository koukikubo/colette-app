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
} from "@/features/standard-codes/types";

type DialogMode = "create" | "edit";

type StandardCodeFormDialogProps = {
  open: boolean;
  mode: DialogMode;
  standardCode?: StandardCode | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: StandardCodeFormValues) => void | Promise<void>;
};

type StandardCodeFormContentProps = {
  mode: DialogMode;
  standardCode?: StandardCode | null;
  isSubmitting: boolean;
  onSubmit: (values: StandardCodeFormValues) => void | Promise<void>;
};

function normalizeNullableText(value: string | null) {
  const trimmedValue = value?.trim() ?? "";

  return trimmedValue === "" ? null : trimmedValue;
}

function buildInitialValues(
  mode: DialogMode,
  standardCode?: StandardCode | null,
): StandardCodeFormValues {
  if (mode === "edit" && standardCode) {
    return {
      code: standardCode.code,
      name: standardCode.name,
      description: standardCode.description,
      active: standardCode.active,
    };
  }

  return {
    code: "",
    name: "",
    description: null,
    active: true,
  };
}

function StandardCodeFormContent({
  mode,
  standardCode,
  isSubmitting,
  onSubmit,
}: StandardCodeFormContentProps) {
  const [values, setValues] = useState<StandardCodeFormValues>(() =>
    buildInitialValues(mode, standardCode),
  );

  const isEditMode = mode === "edit";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      code: values.code.trim(),
      name: values.name.trim(),
      description: normalizeNullableText(values.description),
      active: values.active,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? "基本コードを編集" : "基本コードを追加"}
        </DialogTitle>
        <DialogDescription>
          基本コードは、選択肢コードをまとめる親コードです。
        </DialogDescription>
      </DialogHeader>

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
  );
}

export function StandardCodeFormDialog({
  open,
  mode,
  standardCode,
  isSubmitting = false,
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
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
