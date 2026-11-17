"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/staff-auth/hooks/use-auth";
import { ApiClientError } from "@/lib/api/api-client";

import { createRfCalculationRun } from "../../api/rf-management-api";
import { useRfSettings } from "../../hooks/useRfSettings";

type RfCalculationExecutionSectionProps = {
  reloadKey?: number;
  onCalculationCompleted?: () => void;
};

function todayDate() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function calculationErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return "RF計算を実行できませんでした。";
  }

  return error.errorMessages[0] ?? error.message;
}

export function RfCalculationExecutionSection({
  reloadKey = 0,
  onCalculationCompleted,
}: RfCalculationExecutionSectionProps) {
  const { staff } = useAuth();
  const isOwner = staff?.staff_master.role_code === "owner";

  const {
    settings,
    isLoading,
    errorMessage: settingsErrorMessage,
  } = useRfSettings(reloadKey);

  const [baseDate, setBaseDate] = useState(todayDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // operatorには計算実行UIを表示しない。
  if (!isOwner) {
    return null;
  }

  const publishedRuleSet = settings?.published_rule_set ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!publishedRuleSet) {
      setSubmitErrorMessage("公開中のRFルールがありません。");
      return;
    }

    if (!baseDate) {
      setSubmitErrorMessage("計算基準日を入力してください。");
      return;
    }

    setIsSubmitting(true);
    setSubmitErrorMessage(null);
    setSuccessMessage(null);

    try {
      await createRfCalculationRun({
        rf_rule_set_id: publishedRuleSet.id,
        base_date: baseDate,
      });

      setSuccessMessage(
        "RF計算を受け付けました。完了状況は計算履歴で確認してください。",
      );
      onCalculationCompleted?.();
    } catch (error) {
      setSubmitErrorMessage(calculationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="rf-calculation-execution-heading">
      <div className="mb-3">
        <h2
          id="rf-calculation-execution-heading"
          className="text-lg font-semibold"
        >
          RF計算を実行
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          公開中のルールと計算基準日を使用して、顧客のRFランクを計算します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>計算条件</CardTitle>
        </CardHeader>

        <CardContent>
          {settingsErrorMessage && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {settingsErrorMessage}
            </div>
          )}

          {submitErrorMessage && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {submitErrorMessage}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-4 rounded-lg border border-green-600/40 bg-green-600/10 p-3 text-sm text-green-700"
            >
              {successMessage}
            </div>
          )}

          <form
            className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <Label>使用するRFルール</Label>

              <div className="min-h-10 rounded-md border px-3 py-2 text-sm">
                {isLoading
                  ? "読み込み中..."
                  : publishedRuleSet
                    ? `${publishedRuleSet.name}（バージョン ${publishedRuleSet.version}）`
                    : "公開中のRFルールはありません"}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rf-calculation-base-date">計算基準日</Label>

              <Input
                id="rf-calculation-base-date"
                type="date"
                value={baseDate}
                max={todayDate()}
                disabled={isSubmitting}
                onChange={(event) => setBaseDate(event.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={
                isLoading ||
                isSubmitting ||
                Boolean(settingsErrorMessage) ||
                !publishedRuleSet
              }
            >
              {isSubmitting ? "計算中..." : "RF計算を実行"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
