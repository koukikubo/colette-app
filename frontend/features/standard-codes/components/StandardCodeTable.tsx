import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { StandardCode } from "@/features/standard-codes/types";

type StandardCodeTableProps = {
  /**
   * 表示対象の基本コード一覧。
   *
   * 親コンポーネント側で検索・有効/無効フィルター済みの配列を受け取ります。
   */
  standardCodes: StandardCode[];

  /**
   * 現在選択中の基本コード。
   *
   * 選択中の行に背景色を付けるために使います。
   */
  selectedStandardCode: StandardCode | null;

  /**
   * 基本コード行をクリックした時に実行する関数。
   *
   * 親コンポーネント側で selectedStandardCode を更新し、
   * 紐づく選択肢コード一覧を取得します。
   */
  onSelect: (standardCode: StandardCode) => void;
};

export function StandardCodeTable({
  standardCodes,
  selectedStandardCode,
  onSelect,
}: StandardCodeTableProps) {
  /**
   * 検索・フィルター後に1件も表示対象がない場合の表示です。
   */
  if (standardCodes.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">
          表示できる基本コードがありません。
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">基本コード</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>説明</TableHead>
            <TableHead className="w-20 text-right">状態</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {standardCodes.map((standardCode) => {
            /**
             * 現在選択中の基本コードかどうかを判定します。
             * 選択中の場合は行に背景色を付けます。
             */
            const isSelected =
              selectedStandardCode?.display_code === standardCode.display_code;

            return (
              <TableRow
                key={standardCode.display_code}
                className={
                  isSelected
                    ? "bg-muted cursor-pointer"
                    : "cursor-pointer hover:bg-muted/50"
                }
                onClick={() => onSelect(standardCode)}
              >
                <TableCell className="font-mono text-xs">
                  {standardCode.display_code}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{standardCode.name}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <p className="text-muted-foreground text-sm">
                    {standardCode.description}
                  </p>
                </TableCell>

                <TableCell className="text-right">
                  {standardCode.active ? (
                    <Badge variant="default">有効</Badge>
                  ) : (
                    <Badge variant="secondary">無効</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
