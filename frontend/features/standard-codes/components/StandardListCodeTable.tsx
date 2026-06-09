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
import { Pencil } from "lucide-react";

type StandardListCodeTableProps = {
  standardListCodes: StandardListCode[];
  onEdit: (standardListCode: StandardListCode) => void;
};

export function StandardListCodeTable({
  standardListCodes,
  onEdit,
}: StandardListCodeTableProps) {
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
