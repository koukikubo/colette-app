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

import type { StandardCode } from "@/features/standard-codes/types";
import { Pencil } from "lucide-react";

type StandardCodeTableProps = {
  standardCodes: StandardCode[];
  selectedStandardCode: StandardCode | null;
  onSelect: (standardCode: StandardCode) => void;
  onEdit: (standardCode: StandardCode) => void;
};

export function StandardCodeTable({
  standardCodes,
  selectedStandardCode,
  onSelect,
  onEdit,
}: StandardCodeTableProps) {
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
            <TableHead className="w-24 text-right">操作</TableHead>
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

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(standardCode);
                      }}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      編集
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
