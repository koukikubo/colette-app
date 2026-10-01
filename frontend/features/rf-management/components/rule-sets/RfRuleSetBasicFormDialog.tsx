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

import type { RfRuleSet } from "../../types";
import type { RfRuleSetBasicValues } from "../../utils/rf-rule-set-input";

type FormMode = "create" | "edit";

type RfRuleSetBasicFormDialogProps = {
  open: boolean;
  mode: FormMode;
  ruleSet?: RfRuleSet | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RfRuleSetBasicValues) => Promise<void>;
};

function initialValues(
  mode: FormMode,
  ruleSet?: RfRuleSet | null,
): RfRuleSetBasicValues {
  if (mode === "edit" && ruleSet) {
    return {
      name: ruleSet.name,
      aggregation_months: ruleSet.aggregation_months,
      frequency_window_months: ruleSet.frequency_window_months,
    };
  }

  return {
    name: "",
    aggregation_months: 60,
    frequency_window_months: 12,
  };
}

function BasicForm({
  mode,
  ruleSet,
  isSubmitting,
  errorMessage,
  onSubmit,
}: Omit<RfRuleSetBasicFormDialogProps, "open" | "onOpenChange">) {
  const [values, setValues] = useState(() => initialValues(mode, ruleSet));
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  function updateNumber(
    field: "aggregation_months" | "frequency_window_months",
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      [field]: Number(value),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedValues = {
      ...values,
      name: values.name.trim(),
    };

    if (!normalizedValues.name) {
      setValidationMessage("ルール名を入力してください。");
      return;
    }

    if (
      normalizedValues.aggregation_months < 1 ||
      normalizedValues.frequency_window_months < 1
    ) {
      setValidationMessage("集計期間は1か月以上で入力してください。");
      return;
    }

    if (
      normalizedValues.frequency_window_months >
      normalizedValues.aggregation_months
    ) {
      setValidationMessage(
        "来店回数の対象期間は、全体の集計期間以下にしてください。",
      );
      return;
    }

    setValidationMessage(null);
    await onSubmit(normalizedValues);
  }

  const isEdit = mode === "edit";

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "RFルールの基本設定を編集" : "RFルールを作成"}
        </DialogTitle>

        <DialogDescription>
          まずルール名と集計期間を設定します。R条件・F条件と対応表は次のStepで設定します。
        </DialogDescription>
      </DialogHeader>

      {(validationMessage || errorMessage) && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {validationMessage ?? errorMessage}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rf-rule-name">ルール名</Label>
          <Input
            id="rf-rule-name"
            value={values.name}
            disabled={isSubmitting}
            maxLength={100}
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
          <Label htmlFor="rf-aggregation-months">全体の集計期間</Label>
          <div className="flex items-center gap-2">
            <Input
              id="rf-aggregation-months"
              type="number"
              className="max-w-32"
              min={1}
              step={1}
              value={values.aggregation_months}
              disabled={isSubmitting}
              onChange={(event) =>
                updateNumber("aggregation_months", event.target.value)
              }
              required
            />
            <span className="text-sm text-muted-foreground">か月</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Recency計算で参照する来店履歴の期間です。
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rf-frequency-window-months">来店回数の対象期間</Label>
          <div className="flex items-center gap-2">
            <Input
              id="rf-frequency-window-months"
              type="number"
              className="max-w-32"
              min={1}
              step={1}
              value={values.frequency_window_months}
              disabled={isSubmitting}
              onChange={(event) =>
                updateNumber("frequency_window_months", event.target.value)
              }
              required
            />
            <span className="text-sm text-muted-foreground">か月</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Frequencyの来店回数を数える期間です。全体の集計期間以下に設定します。
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "保存中..."
            : isEdit
              ? "基本設定を保存"
              : "下書きを作成"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RfRuleSetBasicFormDialog({
  open,
  mode,
  ruleSet,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: RfRuleSetBasicFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="sm:max-w-xl">
          <BasicForm
            key={`${mode}-${ruleSet?.id ?? "new"}-${ruleSet?.lock_version ?? 0}`}
            mode={mode}
            ruleSet={ruleSet}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            onSubmit={onSubmit}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
