import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Customer } from "../types";
import { Button } from "@/components/ui/button";
import { EyeIcon, PencilIcon } from "lucide-react";
import Link from "next/link";

type CustomerTableProps = {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function customerKindLabel(customerKind: Customer["customer_kind"]) {
  return customerKind === "corporate" ? "法人" : "個人";
}

// 顧客一覧ページ
export function CustomerTable({ customers, onEdit }: CustomerTableProps) {
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
            <TableHead className="w-44 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customerKindLabel(customer.customer_kind)}</TableCell>

              <TableCell className="font-medium">{customer.name}</TableCell>

              <TableCell>{customer.kana}</TableCell>

              <TableCell>{customer.phone_number ?? "-"}</TableCell>

              <TableCell>{customer.email ?? "-"}</TableCell>

              <TableCell>{customer.company_name ?? "-"}</TableCell>

              <TableCell>{formatDateTime(customer.updated_at)}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/customers/${customer.id}`}>
                    <EyeIcon />
                    詳細
                  </Link>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(customer)}
                  aria-label={`${customer.name}を編集`}
                >
                  <PencilIcon />
                  編集
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
