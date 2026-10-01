"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiClientError } from "@/lib/api/api-client";

import { updateRfRuleSet } from "../../api/rf-management-api";
import type {
  RfFrequencyRuleInput,
  RfRecencyRuleInput,
  RfRankMappingInput,
  RfRuleSet,
  RfRuleSetUpdateInput,
} from "../../types";
import { buildUpdateRfRuleSetInput } from "../../utils/rf-rule-set-input";
import { RfRecencyRulesEditor } from "./RfRecencyRulesEditor";
import { RfFrequencyRulesEditor } from "./RfFrequencyRulesEditor";
import { useRfRankOptions } from "../../hooks/useRfRankOptions";
import { RfRankMappingEditor } from "./RfRankMappingEditor";

type RfRuleSetDraftEditorProps = {
  ruleSet: RfRuleSet;
};

type EditorStep = 1 | 2 | 3 | 4;

const EDITOR_STEPS = [
  "基本設定",
  "Recency条件",
  "Frequency条件",
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

export function RfRuleSetDraftEditor({ ruleSet }: RfRuleSetDraftEditorProps) {
  const {
    options: rankOptions,
    isLoading: isRankOptionsLoading,
    errorMessage: rankOptionsErrorMessage,
  } = useRfRankOptions();
  const [currentStep, setCurrentStep] = useState<EditorStep>(1);
  const [values, setValues] = useState<RfRuleSetUpdateInput>(() =>
    initialEditorValues(ruleSet),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
  }

  function updateRankMappings(rankMappings: RfRankMappingInput[]) {
    setValues((current) => ({
      ...current,
      rank_mappings: rankMappings,
    }));

    setSuccessMessage(null);
  }

  async function saveRecencyRules() {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await updateRfRuleSet(ruleSet.id, values);

      setValues(initialEditorValues(response.data.rule_set));

      setSuccessMessage("Recency条件を保存しました。");
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

      setValues(initialEditorValues(response.data.rule_set));

      setSuccessMessage("Frequency条件を保存しました。");
      setCurrentStep(4);
    } catch (error) {
      setErrorMessage(saveErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveRankMappings() {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await updateRfRuleSet(ruleSet.id, values);

      setValues(initialEditorValues(response.data.rule_set));

      setSuccessMessage("RFランク対応表を保存しました。");
    } catch (error) {
      setErrorMessage(saveErrorMessage(error));
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
                <dt className="text-sm text-muted-foreground">
                  全体の集計期間
                </dt>
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
            </dl>
          </CardContent>

          <CardFooter className="justify-end">
            <Button type="button" onClick={() => setCurrentStep(2)}>
              Recency条件へ
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2：Recency条件</CardTitle>
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
              disabled={isSubmitting}
              onClick={() => void saveRecencyRules()}
            >
              {isSubmitting ? "保存中..." : "Recency条件を保存"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3：Frequency条件</CardTitle>
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
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setCurrentStep(2)}
            >
              Recency条件へ戻る
            </Button>

            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void saveFrequencyRules()}
            >
              {isSubmitting ? "保存中..." : "Frequency条件を保存"}
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
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setCurrentStep(3)}
            >
              Frequency条件へ戻る
            </Button>

            <Button
              type="button"
              disabled={isSubmitting || isRankOptionsLoading}
              onClick={() => void saveRankMappings()}
            >
              {isSubmitting ? "保存中..." : "RFランク対応表を保存"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
