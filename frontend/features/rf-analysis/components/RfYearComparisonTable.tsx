import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { RfAnalysisComparison } from "../types/analysis";

type RfYearComparisonTableProps = {
  comparison: RfAnalysisComparison | null;
};

function formatDate(value: string) {
  return value.replaceAll("-", "/");
}

function formatPercentage(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatDelta(value: number, suffix = "") {
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${value.toLocaleString("ja-JP")}${suffix}`;
}

function deltaClassName(value: number) {
  return cn(
    "font-medium",
    value > 0 && "text-sky-700",
    value < 0 && "text-amber-700",
    value === 0 && "text-muted-foreground",
  );
}

export function RfYearComparisonTable({
  comparison,
}: RfYearComparisonTableProps) {
  if (!comparison) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        1年前に比較できる適用済みのRF計算結果がありません。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        比較対象：{formatDate(comparison.base_date)}
      </p>

      <Table className="min-w-212.5">
        <caption className="sr-only">
          現在と1年前のRFランク別顧客数および割合の比較
        </caption>

        <TableHeader>
          <TableRow>
            <TableHead>RFランク</TableHead>
            <TableHead className="text-right">1年前</TableHead>
            <TableHead className="text-right">現在</TableHead>
            <TableHead className="text-right">人数差</TableHead>
            <TableHead className="text-right">1年前の割合</TableHead>
            <TableHead className="text-right">現在の割合</TableHead>
            <TableHead className="text-right">割合差</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {comparison.ranks.map((rank) => {
            const color = rank.rf_rank.display_color ?? "#64748B";

            return (
              <TableRow key={rank.rf_rank.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium">{rank.rf_rank.label}</span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  {rank.previous_count.toLocaleString("ja-JP")}名
                </TableCell>

                <TableCell className="text-right">
                  {rank.current_count.toLocaleString("ja-JP")}名
                </TableCell>

                <TableCell
                  className={cn("text-right", deltaClassName(rank.count_delta))}
                >
                  {formatDelta(rank.count_delta, "名")}
                </TableCell>

                <TableCell className="text-right">
                  {formatPercentage(rank.previous_percentage)}
                </TableCell>

                <TableCell className="text-right">
                  {formatPercentage(rank.current_percentage)}
                </TableCell>

                <TableCell
                  className={cn(
                    "text-right",
                    deltaClassName(rank.percentage_point_delta),
                  )}
                >
                  {formatDelta(rank.percentage_point_delta, "pt")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
