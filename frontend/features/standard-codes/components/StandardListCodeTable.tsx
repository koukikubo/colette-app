import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { StandardListCode } from "@/features/standard-codes/types";
import { Pencil, Ban } from "lucide-react";

type StandardListCodeTableProps = {
  /**
   * 表示対象の選択肢コード一覧。
   *
   * 親コンポーネント側で検索・有効/無効フィルター済みの配列を受け取ります。
   */
  standardListCodes: StandardListCode[];

  /**
   * 選択肢コードを編集する時に実行する関数。
   */
  onEdit: (standardListCode: StandardListCode) => void;

  /**
   * 選択肢コードを無効化する時に実行する関数。
   */
  onDisable: (standardListCode: StandardListCode) => void;
};

export function StandardListCodeTable({
  standardListCodes,
  onEdit,
  onDisable,
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
            <TableHead className="w-28">選択肢コード</TableHead>
            <TableHead>表示名</TableHead>
            <TableHead>説明</TableHead>
            <TableHead className="w-20 text-right">状態</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {standardListCodes.map((standardListCode) => (
            <TableRow key={standardListCode.display_code}>
              <TableCell className="font-mono text-xs">
                {standardListCode.display_code}
              </TableCell>

              <TableCell>
                <span className="font-medium">{standardListCode.label}</span>
              </TableCell>

              <TableCell>
                <p className="text-muted-foreground text-sm">
                  {standardListCode.description}
                </p>
              </TableCell>

              <TableCell className="text-right">
                {standardListCode.active ? (
                  <Badge variant="default">有効</Badge>
                ) : (
                  <Badge variant="secondary">無効</Badge>
                )}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(standardListCode)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    編集
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!standardListCode.active}
                    onClick={() => onDisable(standardListCode)}
                  >
                    <Ban className="mr-1 h-4 w-4" />
                    無効化
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
