"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmDiscardChangesDialog } from "@/components/common/ConfirmDiscardChangesDialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiClientError } from "@/lib/api/api-client";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

import {
  updateRfRuleSet,
  validateRfRuleSet,
  publishRfRuleSet,
} from "../../api/rf-management-api";

import type {
  RfFrequencyRuleInput,
  RfRecencyRuleInput,
  RfRankMappingInput,
  RfRuleSet,
  RfRuleSetUpdateInput,
  RfRuleSetValidation,
} from "../../types";

import { buildUpdateRfRuleSetInput } from "../../utils/rf-rule-set-input";
import {
  validateFrequencyRules,
  validateRankMappings,
  validateRecencyRules,
} from "../../utils/rf-rule-draft-validation";
import { RfFrequencyRulesEditor } from "./RfFrequencyRulesEditor";
import { useRfRankOptions } from "../../hooks/useRfRankOptions";
import { RfHelpTooltip } from "./RfHelpTooltip";
import { RfInlineValidation } from "./RfInlineValidation";
import { RfRankMappingEditor } from "./RfRankMappingEditor";
import { RfRecencyRulesEditor } from "./RfRecencyRulesEditor";
import { RfRuleSetPreviewTable } from "./RfRuleSetPreviewTable";
import { RfRuleSetValidationResult } from "./RfRuleSetValidationResult";

type RfRuleSetDraftEditorProps = {
  ruleSet: RfRuleSet;
};

type EditorStep = 1 | 2 | 3 | 4 | 5 | 6;

const EDITOR_STEPS = [
  "基本設定",
  "最終来店日からの期間",
  "来店回数",
  "RFランク対応表",
  "検証結果",
  "公開確認",
] as const;

function initialEditorValues(ruleSet: RfRuleSet): RfRuleSetUpdateInput {
  return buildUpdateRfRuleSetInput(ruleSet, {
    name: ruleSet.name,
    aggregation_months: ruleSet.aggregation_months,
    frequency_window_months: ruleSet.frequency_window_months,
  });
}

function saveErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return "RF条件を保存できませんでした。";
  }

  if (error.status === 409) {
    return "ほかの担当者によって更新されています。画面を再読み込みして、もう一度操作してください。";
  }

  return error.errorMessages[0] ?? error.message;
}

function validationErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return "RFルールを検証できませんでした。";
  }

  if (error.status === 409) {
    return "ほかの担当者によって更新されています。画面を再読み込みして、もう一度操作してください。";
  }

  return error.errorMessages[0] ?? error.message;
}

function stepForValidationErrors(validation: RfRuleSetValidation): EditorStep {
  const codes = validation.errors.map((issue) => issue.code);

  if (codes.some((code) => code.startsWith("recency_"))) return 2;
  if (codes.some((code) => code.startsWith("frequency_"))) return 3;
  if (
    codes.some(
      (code) => code.startsWith("mapping_") || code === "inactive_rf_rank",
    )
  ) {
    return 4;
  }

  return 1;
}

export function RfRuleSetDraftEditor({ ruleSet }: RfRuleSetDraftEditorProps) {
  const router = useRouter();
  const {
    options: rankOptions,
    isLoading: isRankOptionsLoading,
    errorMessage: rankOptionsErrorMessage,
  } = useRfRankOptions();
  const [currentStep, setCurrentStep] = useState<EditorStep>(1);
  const [values, setValues] = useState<RfRuleSetUpdateInput>(() =>
    initialEditorValues(ruleSet),
  );
  const [savedValues, setSavedValues] = useState<RfRuleSetUpdateInput>(() =>
    initialEditorValues(ruleSet),
  );
  const isDirty = JSON.stringify(values) !== JSON.stringify(savedValues);
  const { discardDialogOpen, confirmDiscard, handleDiscardDialogOpenChange } =
    useUnsavedChangesGuard(isDirty);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validation, setValidation] = useState<RfRuleSetValidation | null>(
    null,
  );
  const recencyIssues = validateRecencyRules(values.recency_rules);
  const frequencyIssues = validateFrequencyRules(values.frequency_rules);
  const mappingIssues = validateRankMappings(
    values.recency_rules,
    values.frequency_rules,
    values.rank_mappings,
  );

  function updateRecencyRules(recencyRules: RfRecencyRuleInput[]) {
    const availableCodes = new Set(recencyRules.map((rule) => rule.code));

    setValues((current) => ({
      ...current,
      recency_rules: recencyRules,

      // 削除されたR条件を参照する対応表も同時に取り除く。
      rank_mappings: current.rank_mappings.filter((mapping) =>
        availableCodes.has(mapping.recency_code),
      ),
    }));

    setSuccessMessage(null);
    setValidation(null);
  }

  function updateFrequencyRules(frequencyRules: RfFrequencyRuleInput[]) {
    const availableCodes = new Set(frequencyRules.map((rule) => rule.code));

    setValues((current) => ({
      ...current,
      frequency_rules: frequencyRules,

      // 削除されたF条件を参照する対応表も同時に取り除く。
      rank_mappings: current.rank_mappings.filter((mapping) =>
        availableCodes.has(mapping.frequency_code),
      ),
    }));

    setSuccessMessage(null);
    setValidation(null);
  }

  function updateRankMappings(rankMappings: RfRankMappingInput[]) {
    setValues((current) => ({
      ...current,
      rank_mappings: rankMappings,
    }));

    setSuccessMessage(null);
    setValidation(null);
  }

  async function saveRecencyRules() {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await updateRfRuleSet(ruleSet.id, values);

      const persistedValues = initialEditorValues(response.data.rule_set);

      setValues(persistedValues);
      setSavedValues(persistedValues);

      setSuccessMessage("最終来店日からの期間を保存しました。");
      setCurrentStep(3);
    } catch (error) {
      setErrorMessage(saveErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveFrequencyRules() {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await updateRfRuleSet(ruleSet.id, values);

      const persistedValues = initialEditorValues(response.data.rule_set);

      setValues(persistedValues);
      setSavedValues(persistedValues);

      setSuccessMessage("来店回数の条件を保存しました。");
      setCurrentStep(4);
    } catch (error) {
      setErrorMessage(saveErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveAndValidateRankMappings() {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setValidation(null);

    try {
      const updateResponse = await updateRfRuleSet(ruleSet.id, values);

      const persistedValues = initialEditorValues(updateResponse.data.rule_set);

      setValues(persistedValues);
      setSavedValues(persistedValues);

      const validationResponse = await validateRfRuleSet(ruleSet.id);

      setValidation(validationResponse.data.validation);
      setCurrentStep(5);
    } catch (error) {
      setErrorMessage(validationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function publishRuleSet() {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await publishRfRuleSet(ruleSet.id, values.lock_version);

      router.push("/rf-management");
      router.refresh();
    } catch (error) {
      setErrorMessage(validationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <nav aria-label="RFルール設定手順">
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          {EDITOR_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isCurrent = stepNumber === currentStep;

            return (
              <li
                key={step}
                aria-current={isCurrent ? "step" : undefined}
                className={
                  isCurrent
                    ? "rounded-lg border bg-foreground p-3 text-background"
                    : "rounded-lg border p-3 text-muted-foreground"
                }
              >
                <span className="block text-xs">Step {stepNumber}</span>
                <span className="mt-1 block text-sm font-medium">{step}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1：基本設定</CardTitle>
          </CardHeader>

          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted-foreground">ルール名</dt>
                <dd className="mt-1 font-medium">{values.name}</dd>
              </div>

              <div>
                <dt className="flex items-center gap-1 text-sm text-muted-foreground">
                  全体の集計期間
                  <RfHelpTooltip label="全体の集計期間">
                    RFランクを計算するときに、予約履歴をさかのぼって確認する期間です。
                  </RfHelpTooltip>
                </dt>
                <dd className="mt-1 font-medium">
                  {values.aggregation_months}か月
                </dd>
              </div>

              <div>
                <dt className="flex items-center gap-1 text-sm text-muted-foreground">
                  来店回数の対象期間
                  <RfHelpTooltip label="来店回数の対象期間">
                    全体の集計期間のうち、来店回数を数える直近の期間です。
                  </RfHelpTooltip>
                </dt>
                <dd className="mt-1 font-medium">
                  {values.frequency_window_months}か月
                </dd>
              </div>
            </dl>
          </CardContent>

          <CardFooter className="justify-end">
            <Button type="button" onClick={() => setCurrentStep(2)}>
              最終来店日からの期間へ
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2：最終来店日からの期間</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div role="status" className="rounded-lg border p-3 text-sm">
                {successMessage}
              </div>
            )}

            <RfRecencyRulesEditor
              rules={values.recency_rules}
              disabled={isSubmitting}
              onChange={updateRecencyRules}
            />

            <RfInlineValidation issues={recencyIssues} />

            <RfRuleSetPreviewTable
              recencyRules={values.recency_rules}
              frequencyRules={values.frequency_rules}
              mappings={values.rank_mappings}
              rankOptions={rankOptions}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setCurrentStep(1)}
            >
              基本設定へ戻る
            </Button>

            <Button
              type="button"
              disabled={isSubmitting || recencyIssues.length > 0}
              onClick={() => void saveRecencyRules()}
            >
              {isSubmitting ? "保存中..." : "最終来店日からの期間を保存"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3：対象期間内の来店回数</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div role="status" className="rounded-lg border p-3 text-sm">
                {successMessage}
              </div>
            )}

            <RfFrequencyRulesEditor
              rules={values.frequency_rules}
              disabled={isSubmitting}
              onChange={updateFrequencyRules}
            />

            <RfInlineValidation issues={frequencyIssues} />

            <RfRuleSetPreviewTable
              recencyRules={values.recency_rules}
              frequencyRules={values.frequency_rules}
              mappings={values.rank_mappings}
              rankOptions={rankOptions}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setCurrentStep(2)}
            >
              最終来店日からの期間へ戻る
            </Button>

            <Button
              type="button"
              disabled={isSubmitting || frequencyIssues.length > 0}
              onClick={() => void saveFrequencyRules()}
            >
              {isSubmitting ? "保存中..." : "来店回数の条件を保存"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4：RFランク対応表</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {(errorMessage || rankOptionsErrorMessage) && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {errorMessage ?? rankOptionsErrorMessage}
              </div>
            )}

            {successMessage && (
              <div role="status" className="rounded-lg border p-3 text-sm">
                {successMessage}
              </div>
            )}

            {isRankOptionsLoading ? (
              <p className="text-sm text-muted-foreground">
                RFランクを読み込んでいます。
              </p>
            ) : (
              <RfRankMappingEditor
                recencyRules={values.recency_rules}
                frequencyRules={values.frequency_rules}
                mappings={values.rank_mappings}
                rankOptions={rankOptions}
                disabled={isSubmitting}
                onChange={updateRankMappings}
              />
            )}

            <RfInlineValidation issues={mappingIssues} />
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setCurrentStep(3)}
            >
              来店回数の条件へ戻る
            </Button>

            <Button
              type="button"
              disabled={
                isSubmitting ||
                isRankOptionsLoading ||
                recencyIssues.length > 0 ||
                frequencyIssues.length > 0 ||
                mappingIssues.length > 0
              }
              onClick={() => void saveAndValidateRankMappings()}
            >
              {isSubmitting ? "検証中..." : "RFランク対応表を保存して検証"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 5：検証結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            )}

            {validation ? (
              <RfRuleSetValidationResult validation={validation} />
            ) : (
              <p className="text-sm text-muted-foreground">
                検証結果を取得できませんでした。
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() =>
                setCurrentStep(
                  validation && !validation.valid
                    ? stepForValidationErrors(validation)
                    : 4,
                )
              }
            >
              {validation?.valid
                ? "RFランク対応表へ戻る"
                : "問題のある設定を修正する"}
            </Button>

            {validation?.valid && (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(6)}
              >
                公開確認へ
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {currentStep === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 6：公開確認</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            )}

            <div className="rounded-lg border p-4">
              <p className="font-medium">{values.name}</p>

              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm text-muted-foreground">集計期間</dt>
                  <dd className="mt-1 font-medium">
                    {values.aggregation_months}か月
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    来店回数の対象期間
                  </dt>
                  <dd className="mt-1 font-medium">
                    {values.frequency_window_months}か月
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    最終来店日からの期間
                  </dt>
                  <dd className="mt-1 font-medium">
                    {values.recency_rules.length}件
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    来店回数の条件
                  </dt>
                  <dd className="mt-1 font-medium">
                    {values.frequency_rules.length}件
                  </dd>
                </div>
              </dl>
            </div>

            <RfRuleSetPreviewTable
              recencyRules={values.recency_rules}
              frequencyRules={values.frequency_rules}
              mappings={values.rank_mappings}
              rankOptions={rankOptions}
            />

            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-medium">公開後の動作</p>
              <p className="mt-1 text-muted-foreground">
                このルールが新しい公開中ルールになります。
                現在公開中のルールがある場合は、自動的にアーカイブされます。
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setCurrentStep(5)}
            >
              検証結果へ戻る
            </Button>

            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void publishRuleSet()}
            >
              {isSubmitting ? "公開中..." : "このRFルールを公開"}
            </Button>
          </CardFooter>
        </Card>
      )}
      <ConfirmDiscardChangesDialog
        open={discardDialogOpen}
        onOpenChange={handleDiscardDialogOpenChange}
        onConfirm={confirmDiscard}
      />
    </div>
  );
}
