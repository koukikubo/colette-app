"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { RfRankMappingInput, RfRankOption, RfRuleSet } from "../../types";
import { RfRuleSetStatusBadge } from "../status/RfStatusBadge";
import { RfRuleSetPreviewTable } from "./RfRuleSetPreviewTable";

type RfRuleSetDetailDialogProps = {
  open: boolean;
  ruleSet: RfRuleSet | null;
  isLoading: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
};

export function previewValues(ruleSet: RfRuleSet) {
  const recencyRules = ruleSet.recency_rules.map((rule) => ({
    code: rule.code,
    label: rule.label,
    min_days: rule.min_days,
    max_days: rule.max_days,
    position: rule.position,
  }));
  const frequencyRules = ruleSet.frequency_rules.map((rule) => ({
    code: rule.code,
    label: rule.label,
    min_visits: rule.min_visits,
    max_visits: rule.max_visits,
    position: rule.position,
  }));
  const recencyCodes = new Map(
    ruleSet.recency_rules.map((rule) => [rule.id, rule.code]),
  );
  const frequencyCodes = new Map(
    ruleSet.frequency_rules.map((rule) => [rule.id, rule.code]),
  );
  const rankOptionsById = new Map<number, RfRankOption>();
  const mappings: RfRankMappingInput[] = [];

  ruleSet.rank_mappings.forEach((mapping) => {
    const recencyCode = recencyCodes.get(mapping.recency_rule_id);
    const frequencyCode = frequencyCodes.get(mapping.frequency_rule_id);

    if (!recencyCode || !frequencyCode) return;

    rankOptionsById.set(mapping.rf_rank.id, {
      id: mapping.rf_rank.id,
      label: mapping.rf_rank.label,
    });
    mappings.push({
      recency_code: recencyCode,
      frequency_code: frequencyCode,
      rf_rank_id: mapping.rf_rank.id,
    });
  });

  return {
    recencyRules,
    frequencyRules,
    mappings,
    rankOptions: [...rankOptionsById.values()],
  };
}

export function RfRuleSetDetailDialog({
  open,
  ruleSet,
  isLoading,
  errorMessage,
  onOpenChange,
}: RfRuleSetDetailDialogProps) {
  const preview = ruleSet ? previewValues(ruleSet) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>RFルールの設定内容</DialogTitle>
          <DialogDescription>
            過去の判定基準を確認できます。この画面から内容は変更されません。
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p role="status" className="py-8 text-center text-muted-foreground">
            設定内容を読み込んでいます。
          </p>
        ) : errorMessage ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive"
          >
            {errorMessage}
          </div>
        ) : ruleSet && preview ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
              <div>
                <p className="font-medium">{ruleSet.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  バージョン {ruleSet.version}
                </p>
              </div>
              <RfRuleSetStatusBadge status={ruleSet.status} />

              <dl className="grid w-full gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">
                    全体の集計期間
                  </dt>
                  <dd className="mt-1 font-medium">
                    {ruleSet.aggregation_months}か月
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    来店回数の対象期間
                  </dt>
                  <dd className="mt-1 font-medium">
                    {ruleSet.frequency_window_months}か月
                  </dd>
                </div>
              </dl>
            </div>

            {ruleSet.status === "archived" && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium">アーカイブ済みルールについて</p>
                <p className="mt-1 text-muted-foreground">
                  このルールは過去の履歴として保存されています。編集・再公開・削除はできません。似た条件を使う場合は、新しいルールを作成してください。
                </p>
              </div>
            )}

            <RfRuleSetPreviewTable {...preview} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
