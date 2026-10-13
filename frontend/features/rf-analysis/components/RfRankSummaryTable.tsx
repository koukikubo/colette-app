import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { RfAnalysisRankDistribution } from "../types/analysis";

type RfRankSummaryTableProps = {
  ranks: RfAnalysisRankDistribution[];
};

export function RfRankSummaryTable({ ranks }: RfRankSummaryTableProps) {
  return (
    <Table>
      <caption className="sr-only">現在のRFランク別顧客数と顧客割合</caption>

      <TableHeader>
        <TableRow>
          <TableHead>RFランク</TableHead>
          <TableHead className="text-right">顧客数</TableHead>
          <TableHead className="text-right">顧客割合</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {ranks.map(({ rf_rank, count, percentage }) => {
          const color = rf_rank.display_color ?? "#64748B";

          return (
            <TableRow key={rf_rank.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium">{rf_rank.label}</span>
                </div>
              </TableCell>

              <TableCell className="text-right font-semibold">
                {count.toLocaleString("ja-JP")}名
              </TableCell>

              <TableCell className="text-right">
                {percentage.toFixed(2)}%
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
