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

import type { RestaurantTable } from "@/features/restaurant-tables/types";

type RestaurantTableTableProps = {
  restaurantTables: RestaurantTable[];
};

export function RestaurantTableTable({
  restaurantTables,
}: RestaurantTableTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>席コード</TableHead>
            <TableHead>席名</TableHead>
            <TableHead>席種</TableHead>
            <TableHead className="text-right">定員</TableHead>
            <TableHead className="text-right">表示順</TableHead>
            <TableHead>状態</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {restaurantTables.map((restaurantTable) => (
            <TableRow key={restaurantTable.id}>
              <TableCell className="font-mono font-medium">
                {restaurantTable.code}
              </TableCell>

              <TableCell className="font-medium">
                {restaurantTable.name}
              </TableCell>

              <TableCell>
                {restaurantTable.restaurant_table_type.label}
              </TableCell>

              <TableCell className="text-right">
                {restaurantTable.capacity}名
              </TableCell>

              <TableCell className="text-right">
                {restaurantTable.position}
              </TableCell>

              <TableCell>
                <Badge
                  variant={restaurantTable.active ? "default" : "secondary"}
                >
                  {restaurantTable.active ? "有効" : "無効"}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled
                    aria-label={`${restaurantTable.name}の詳細を表示`}
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled
                    aria-label={`${restaurantTable.name}を編集`}
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
