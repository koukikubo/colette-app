import { PermissionGate } from "@/features/staff-auth/components/session/PermissionGate";
import Link from "next/link";
import { EyeIcon, PencilIcon } from "lucide-react";

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

import {
  CUSTOMER_RF_STATES,
  type Customer,
  type CustomerListItem,
} from "../../types";
import { formatCustomerPhoneNumber } from "../../utils/customer-display";

type CustomerTableProps = {
  customers: CustomerListItem[];
  onEdit: (customer: Customer) => void;
  returnPath?: string;
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
export function CustomerTable({
  customers,
  onEdit,
  returnPath = "/customers",
}: CustomerTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table className="min-w-[720px] xl:min-w-[1100px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">区分</TableHead>
            <TableHead className="w-24">表示状態</TableHead>
            <TableHead className="min-w-40">顧客名</TableHead>
            <TableHead>手動ランク</TableHead>
            <TableHead>RFランク</TableHead>
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
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <Badge
                  variant={
                    customer.customer_kind === "corporate"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {customerKindLabel(customer.customer_kind)}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge
                  variant={customer.hidden ? "secondary" : "outline"}
                  className={
                    customer.hidden
                      ? undefined
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }
                >
                  {customer.hidden ? "非表示" : "表示中"}
                </Badge>
              </TableCell>

              <TableCell className="font-medium">{customer.name}</TableCell>

              <TableCell>{customer.customer_rank?.label ?? "未設定"}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  {customer.current_rf_rank && (
                    <span
                      aria-hidden="true"
                      data-testid={`rf-rank-color-${customer.id}`}
                      className="size-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: /^#[0-9a-f]{6}$/i.test(
                          customer.current_rf_rank.display_color ?? "",
                        )
                          ? customer.current_rf_rank.display_color!
                          : "#64748B",
                      }}
                    />
                  )}
                  <span>
                    {customer.rf_rank_state === "ranked" &&
                    customer.current_rf_rank
                      ? customer.current_rf_rank.label
                      : CUSTOMER_RF_STATES[
                          customer.rf_rank_state ?? "not_calculated"
                        ]}
                  </span>
                  {customer.rf_rank_state === "no_visit" &&
                    customer.current_rf_rank && (
                      <span className="text-xs text-muted-foreground">
                        {customer.current_rf_rank.label}
                      </span>
                    )}
                </span>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                {customer.kana}
              </TableCell>

              <TableCell className="whitespace-nowrap tabular-nums">
                {formatCustomerPhoneNumber(customer.phone_number)}
              </TableCell>

              <TableCell className="hidden xl:table-cell">
                {customer.email ?? "-"}
              </TableCell>

              <TableCell className="hidden xl:table-cell">
                {customer.company_name ?? "-"}
              </TableCell>

              <TableCell className="hidden whitespace-nowrap lg:table-cell">
                {formatDateTime(customer.updated_at)}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/customers/${customer.id}?return_to=${encodeURIComponent(returnPath)}`}
                      aria-label={`${customer.name}の詳細を表示`}
                    >
                      <EyeIcon />
                      詳細
                    </Link>
                  </Button>

                  <PermissionGate resource="customers">
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
                  </PermissionGate>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
