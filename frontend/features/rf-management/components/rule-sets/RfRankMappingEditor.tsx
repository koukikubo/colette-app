"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type RfRankMappingEditorProps = {
  recencyRules: RfRecencyRuleInput[];
  frequencyRules: RfFrequencyRuleInput[];
  mappings: RfRankMappingInput[];
  rankOptions: RfRankOption[];
  disabled?: boolean;
  onChange: (mappings: RfRankMappingInput[]) => void;
};

const UNASSIGNED_VALUE = "unassigned";

export function RfRankMappingEditor({
  recencyRules,
  frequencyRules,
  mappings,
  rankOptions,
  disabled = false,
  onChange,
}: RfRankMappingEditorProps) {
  function findMapping(recencyCode: string, frequencyCode: string) {
    return mappings.find(
      (mapping) =>
        mapping.recency_code === recencyCode &&
        mapping.frequency_code === frequencyCode,
    );
  }

  function updateMapping(
    recencyCode: string,
    frequencyCode: string,
    value: string,
  ) {
    const otherMappings = mappings.filter(
      (mapping) =>
        mapping.recency_code !== recencyCode ||
        mapping.frequency_code !== frequencyCode,
    );

    if (value === UNASSIGNED_VALUE) {
      onChange(otherMappings);
      return;
    }

    onChange([
      ...otherMappings,
      {
        recency_code: recencyCode,
        frequency_code: frequencyCode,
        rf_rank_id: Number(value),
      },
    ]);
  }

  if (recencyRules.length === 0 || frequencyRules.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          対応表を作成するには、最終来店日からの期間と来店回数の条件が必要です。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <div className="flex items-center gap-1">
          <p className="font-medium">RFランク対応表</p>
          <RfHelpTooltip label="RFランク対応表">
            顧客の最終来店日からの期間と来店回数を照らし合わせ、交差した欄のRFランクを付与します。
          </RfHelpTooltip>
        </div>
        <p className="mt-1 text-muted-foreground">
          すべての組み合わせにRFランクを選択してください。
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>最終来店日からの期間 / 来店回数</TableHead>

            {frequencyRules.map((frequencyRule) => (
              <TableHead key={frequencyRule.code}>
                <span className="block">{frequencyRule.label}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {recencyRules.map((recencyRule) => (
            <TableRow key={recencyRule.code}>
              <TableHead scope="row">
                <span className="block">{recencyRule.label}</span>
              </TableHead>

              {frequencyRules.map((frequencyRule) => {
                const mapping = findMapping(
                  recencyRule.code,
                  frequencyRule.code,
                );

                return (
                  <TableCell key={frequencyRule.code}>
                    <Select
                      value={
                        mapping ? String(mapping.rf_rank_id) : UNASSIGNED_VALUE
                      }
                      disabled={disabled || rankOptions.length === 0}
                      onValueChange={(value) =>
                        updateMapping(
                          recencyRule.code,
                          frequencyRule.code,
                          value,
                        )
                      }
                    >
                      <SelectTrigger
                        className="w-full min-w-32"
                        aria-label={`${recencyRule.label}・${frequencyRule.label}のRFランク`}
                      >
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value={UNASSIGNED_VALUE}>未設定</SelectItem>

                        {rankOptions.map((rank) => (
                          <SelectItem key={rank.id} value={String(rank.id)}>
                            {rank.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
