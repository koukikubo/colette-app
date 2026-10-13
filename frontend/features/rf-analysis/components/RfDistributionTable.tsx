import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { RfFrequencyRule, RfRecencyRule } from "../../rf-management/types";
import { RfAnalysisCell } from "../types/analysis";

type RfDistributionTableProps = {
  recencyRules: RfRecencyRule[];
  frequencyRules: RfFrequencyRule[];
  cells: RfAnalysisCell[];
};

function cellKey(recencyRuleId: number, frequencyRuleId: number) {
  return `${recencyRuleId}:${frequencyRuleId}`;
}

function formatPercentage(value: number) {
  return `${value.toFixed(2)}%`;
}

export function RfDistributionTable({
  recencyRules,
  frequencyRules,
  cells,
}: RfDistributionTableProps) {
  const cellsByCondition = new Map(
    cells.map((cell) => [
      cellKey(cell.recency_rule_id, cell.frequency_rule_id),
      cell,
    ]),
  );

  return (
    <Table className="min-w-200">
      <caption className="sr-only">
        最終来店期間と来店回数ごとのRFランク、顧客数、顧客割合
      </caption>

      <TableHeader>
        <TableRow>
          <TableHead className="sticky left-0 z-10 min-w-40 bg-background">
            最終来店期間 ＼ 来店回数
          </TableHead>

          {frequencyRules.map((rule) => (
            <TableHead key={rule.id} className="min-w-40 text-center">
              {rule.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {recencyRules.map((recencyRule) => (
          <TableRow key={recencyRule.id}>
            <TableHead
              scope="row"
              className="sticky left-0 z-10 bg-background font-medium"
            >
              {recencyRule.label}
            </TableHead>

            {frequencyRules.map((frequencyRule) => {
              const cell = cellsByCondition.get(
                cellKey(recencyRule.id, frequencyRule.id),
              );

              if (!cell) {
                return (
                  <TableCell
                    key={frequencyRule.id}
                    className="text-center text-muted-foreground"
                  >
                    —
                  </TableCell>
                );
              }

              const color = cell.rf_rank.display_color ?? "#64748B";

              return (
                <TableCell key={frequencyRule.id} className="p-2">
                  <div
                    className="rounded-lg border-l-4 p-3"
                    style={{
                      borderLeftColor: color,
                      backgroundColor: `${color}0D`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium">{cell.rf_rank.label}</span>
                    </div>

                    <p className="mt-2 text-lg font-semibold">
                      {cell.count.toLocaleString("ja-JP")}名
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(cell.percentage)}
                    </p>
                  </div>
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
