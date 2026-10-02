import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  RfFrequencyRuleInput,
  RfRankMappingInput,
  RfRankOption,
  RfRecencyRuleInput,
} from "../../types";
import { RfHelpTooltip } from "./RfHelpTooltip";

type RfRuleSetPreviewTableProps = {
  recencyRules: RfRecencyRuleInput[];
  frequencyRules: RfFrequencyRuleInput[];
  mappings: RfRankMappingInput[];
  rankOptions: RfRankOption[];
};

function recencyLabel(rule: RfRecencyRuleInput) {
  if (rule.label.trim()) return rule.label;

  return rule.max_days === null
    ? `${rule.min_days}日以上`
    : `${rule.min_days}〜${rule.max_days}日`;
}

function frequencyLabel(rule: RfFrequencyRuleInput) {
  if (rule.label.trim()) return rule.label;

  return rule.max_visits === null
    ? `${rule.min_visits}回以上`
    : `${rule.min_visits}〜${rule.max_visits}回`;
}

export function RfRuleSetPreviewTable({
  recencyRules,
  frequencyRules,
  mappings,
  rankOptions,
}: RfRuleSetPreviewTableProps) {
  return (
    <section aria-labelledby="rf-rule-preview-heading" className="space-y-3">
      <div className="flex items-center gap-1">
        <h3 id="rf-rule-preview-heading" className="font-medium">
          設定プレビュー
        </h3>
        <RfHelpTooltip label="設定プレビュー">
          行は最終来店日からの期間、列は対象期間内の来店回数です。交差する欄が顧客に付与されるRFランクです。
        </RfHelpTooltip>
      </div>

      {recencyRules.length === 0 || frequencyRules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          最終来店日からの期間と来店回数を追加すると、ここに完成イメージが表示されます。
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>最終来店日からの期間</TableHead>
                {frequencyRules.map((rule) => (
                  <TableHead key={rule.code}>{frequencyLabel(rule)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {recencyRules.map((recencyRule) => (
                <TableRow key={recencyRule.code}>
                  <TableHead scope="row">{recencyLabel(recencyRule)}</TableHead>

                  {frequencyRules.map((frequencyRule) => {
                    const mapping = mappings.find(
                      (item) =>
                        item.recency_code === recencyRule.code &&
                        item.frequency_code === frequencyRule.code,
                    );
                    const rank = rankOptions.find(
                      (item) => item.id === mapping?.rf_rank_id,
                    );

                    return (
                      <TableCell key={frequencyRule.code}>
                        {rank ? (
                          <Badge variant="secondary">{rank.label}</Badge>
                        ) : (
                          <span className="text-muted-foreground">未設定</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
