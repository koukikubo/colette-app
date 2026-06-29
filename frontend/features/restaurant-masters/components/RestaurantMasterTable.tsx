import { Eye, Pencil } from "lucide-react";

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

import type { RestaurantMaster } from "@/features/restaurant-masters/types";

type RestaurantMasterTableProps = {
  RestaurantMasters: RestaurantMaster[];
};

export function RestaurantMasterTable({
  RestaurantMasters,
}: RestaurantMasterTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>席コード</TableHead>
            <TableHead>席名</TableHead>
            <TableHead>席種</TableHead>
            <TableHead className="text-right">定員</TableHead>
            <TableHead>状態</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {RestaurantMasters.map((RestaurantMaster) => (
            <TableRow key={RestaurantMaster.id}>
              <TableCell className="font-mono font-medium">
                {RestaurantMaster.code}
              </TableCell>

              <TableCell className="font-medium">
                {RestaurantMaster.name}
              </TableCell>

              <TableCell>
                {RestaurantMaster.restaurant_master_type.label}
              </TableCell>

              <TableCell className="text-right">
                {RestaurantMaster.capacity}名
              </TableCell>

              <TableCell>
                <Badge
                  variant={RestaurantMaster.active ? "default" : "secondary"}
                >
                  {RestaurantMaster.active ? "有効" : "無効"}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled
                    aria-label={`${RestaurantMaster.name}の詳細を表示`}
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled
                    aria-label={`${RestaurantMaster.name}を編集`}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
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
