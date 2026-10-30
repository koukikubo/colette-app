import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  RfCustomerTransitionTable,
  RfTransitionRankPopulation,
} from "../types/customer-transition";

type Props = {
  table: RfCustomerTransitionTable;
};

function formatCount(value: number) {
  return `${value.toLocaleString("ja-JP")}名`;
}

export function RfCustomerPopulationTable({ table }: Props) {
  const columnsById = new Map<number, RfTransitionRankPopulation>();

  for (const row of table.rows) {
    for (const rank of row.ranks) {
      if (!columnsById.has(rank.id)) {
        columnsById.set(rank.id, rank);
      }
    }
  }

  const columns = [...columnsById.values()].sort(
    (a, b) => a.position - b.position || a.id - b.id,
  );

  if (table.rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        適用済みのRF計算履歴がありません。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        ランク名と色は各計算当時の情報です。—は、その履歴にランク情報がないことを示します。
      </p>

      <Table className="min-w-max">
        <caption className="sr-only">計算履歴ごとのRFランク別顧客数</caption>

        <TableHeader>
          <TableRow>
            <TableHead>計算基準日</TableHead>

            {columns.map((rank) => (
              <TableHead key={rank.id}>ランク {rank.display_code}</TableHead>
            ))}

            <TableHead className="text-right">計算対象</TableHead>
            <TableHead className="text-right">未分類</TableHead>
            <TableHead className="text-right">対象外</TableHead>
            <TableHead className="text-right">合計</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {table.rows.map((row) => {
            const ranksById = new Map(row.ranks.map((rank) => [rank.id, rank]));

            return (
              <TableRow key={row.calculation_run_id}>
                <TableCell className="align-top">
                  <div className="font-medium">
                    {row.base_date.replaceAll("-", "/")}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    計算 #{row.calculation_run_id}
                  </div>

                  {row.calculation_run_id ===
                    table.current_calculation_run_id && (
                    <span className="text-xs font-medium text-emerald-700">
                      現在適用中
                    </span>
                  )}
                </TableCell>

                {columns.map((column) => {
                  const rank = ranksById.get(column.id);

                  return (
                    <TableCell key={column.id} className="align-top">
                      {rank ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="size-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  rank.display_color ?? "#64748B",
                              }}
                            />
                            <span>{rank.label}</span>
                          </div>

                          <div className="text-right font-semibold">
                            {formatCount(rank.count)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  );
                })}

                <TableCell className="text-right">
                  {formatCount(row.eligible_count)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCount(row.unmatched_count)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCount(row.excluded_count)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCount(row.total_count)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <p className="text-sm text-muted-foreground">
        計算対象には未分類を含みます。計算対象＋対象外＝合計です。
      </p>
    </div>
  );
}
