import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { StandardListCode } from "@/features/standard-codes/types";

type StandardListCodeTableProps = {
  /**
   * 表示対象の選択肢コード一覧。
   *
   * 親コンポーネント側で検索・有効/無効フィルター済みの配列を受け取ります。
   */
  standardListCodes: StandardListCode[];
};

export function StandardListCodeTable({
  standardListCodes,
}: StandardListCodeTableProps) {
  /**
   * 検索・フィルター後に1件も表示対象がない場合の表示です。
   */
  if (standardListCodes.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">
          表示できる選択肢コードがありません。
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">コード</TableHead>
            <TableHead>表示名</TableHead>
            <TableHead className="w-24 text-right">並び順</TableHead>
            <TableHead className="w-20 text-right">状態</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {standardListCodes.map((standardListCode) => (
            <TableRow key={standardListCode.code}>
              <TableCell className="font-mono text-xs">
                {standardListCode.code}
              </TableCell>

              <TableCell>
                <span className="font-medium">{standardListCode.label}</span>
              </TableCell>

              <TableCell className="text-right">
                {standardListCode.position}
              </TableCell>

              <TableCell className="text-right">
                {standardListCode.active ? (
                  <Badge variant="default">有効</Badge>
                ) : (
                  <Badge variant="secondary">無効</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
