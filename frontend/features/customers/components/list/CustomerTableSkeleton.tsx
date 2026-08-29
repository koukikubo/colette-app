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
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table className="min-w-[720px] xl:min-w-[1100px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">区分</TableHead>
            <TableHead className="w-24">表示状態</TableHead>
            <TableHead className="min-w-40">顧客名</TableHead>
            <TableHead className="hidden lg:table-cell">フリガナ</TableHead>
            <TableHead className="min-w-36">電話番号</TableHead>
            <TableHead className="hidden xl:table-cell">
              メールアドレス
            </TableHead>
            <TableHead className="hidden xl:table-cell">法人名</TableHead>
            <TableHead className="hidden w-40 lg:table-cell">
              最終更新日時
            </TableHead>
            <TableHead className="w-44 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-5 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-14" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-5 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-28" />
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <Skeleton className="h-5 w-40" />
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <Skeleton className="h-5 w-32" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-5 w-32" />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
