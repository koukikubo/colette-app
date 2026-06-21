import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SKELETON_ROW_COUNT = 5;

export function CustomerTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">区分</TableHead>
            <TableHead>顧客名</TableHead>
            <TableHead>フリガナ</TableHead>
            <TableHead>電話番号</TableHead>
            <TableHead>メールアドレス</TableHead>
            <TableHead>法人名</TableHead>
            <TableHead className="w-40">最終更新日時</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-5 w-10" />
              </TableCell>

              <TableCell>
                <Skeleton className="h-5 w-28" />
              </TableCell>

              <TableCell>
                <Skeleton className="h-5 w-28" />
              </TableCell>

              <TableCell>
                <Skeleton className="h-5 w-28" />
              </TableCell>

              <TableCell>
                <Skeleton className="h-5 w-40" />
              </TableCell>

              <TableCell>
                <Skeleton className="h-5 w-32" />
              </TableCell>

              <TableCell>
                <Skeleton className="h-5 w-32" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
