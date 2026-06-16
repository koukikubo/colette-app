"use client";

import { PencilIcon, RotateCcwIcon } from "lucide-react";

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

import type { StaffMaster, StaffRoleCode } from "../types";

type ListMode = "active" | "retired";

type StaffMasterTableProps = {
  staffMasters: StaffMaster[];
  listMode: ListMode;
  onEdit?: (staffMaster: StaffMaster) => void;
  onRestore?: (staffMaster: StaffMaster) => void;
};

const STAFF_ROLE_LABELS: Record<StaffRoleCode, string> = {
  owner: "管理者",
  operator: "一般スタッフ",
  viewer: "閲覧のみ",
};

export function StaffMasterTable({
  staffMasters,
  listMode,
  onEdit,
  onRestore,
}: StaffMasterTableProps) {
  const isRetiredList = listMode === "retired";

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-28">コード</TableHead>
            <TableHead className="min-w-32">担当者名</TableHead>
            <TableHead className="min-w-32">権限</TableHead>
            <TableHead className="min-w-32">入社日</TableHead>

            {isRetiredList && (
              <TableHead className="min-w-32">退職日</TableHead>
            )}

            <TableHead className="min-w-32">ログイン</TableHead>

            {!isRetiredList && (
              <>
                <TableHead className="min-w-28">状態</TableHead>
                <TableHead className="min-w-24 text-right">失敗回数</TableHead>
              </>
            )}

            <TableHead className="min-w-40">最終ログイン</TableHead>

            <TableHead className="min-w-24 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {staffMasters.map((staffMaster) => {
            const staff = staffMaster.staff;

            return (
              <TableRow key={staffMaster.id}>
                <TableCell className="font-mono font-medium">
                  {staffMaster.code}
                </TableCell>

                <TableCell className="font-medium">
                  {staffMaster.name}
                </TableCell>

                <TableCell>
                  <RoleBadge roleCode={staffMaster.role_code} />
                </TableCell>

                <TableCell>
                  {formatDate(staffMaster.employment_started_on)}
                </TableCell>

                {isRetiredList && (
                  <TableCell>{formatDate(staffMaster.retired_on)}</TableCell>
                )}

                <TableCell>
                  <LoginEnabledBadge
                    loginEnabled={staff?.login_enabled ?? false}
                    hasLoginAccount={staff !== null}
                  />
                </TableCell>

                {!isRetiredList && (
                  <>
                    <TableCell>
                      <AccountStatusBadge
                        locked={staff?.locked ?? false}
                        hasLoginAccount={staff !== null}
                      />
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      {staff ? `${staff.failed_attempts}回` : "—"}
                    </TableCell>
                  </>
                )}

                <TableCell>
                  {formatDateTime(staff?.last_logged_in_at)}
                </TableCell>

                <TableCell className="text-right">
                  {isRetiredList ? (
                    onRestore ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onRestore(staffMaster)}
                        aria-label={`${staffMaster.name}を復帰させる`}
                      >
                        <RotateCcwIcon aria-hidden="true" />
                        復帰
                      </Button>
                    ) : (
                      "—"
                    )
                  ) : onEdit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(staffMaster)}
                      aria-label={`${staffMaster.name}を編集する`}
                    >
                      <PencilIcon aria-hidden="true" />
                      編集
                    </Button>
                  ) : (
                    "—"
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

function RoleBadge({ roleCode }: { roleCode: StaffRoleCode }) {
  return <Badge variant="secondary">{STAFF_ROLE_LABELS[roleCode]}</Badge>;
}

function LoginEnabledBadge({
  loginEnabled,
  hasLoginAccount,
}: {
  loginEnabled: boolean;
  hasLoginAccount: boolean;
}) {
  if (!hasLoginAccount) {
    return <Badge variant="outline">未登録</Badge>;
  }

  return loginEnabled ? (
    <Badge variant="default">有効</Badge>
  ) : (
    <Badge variant="secondary">無効</Badge>
  );
}

function AccountStatusBadge({
  locked,
  hasLoginAccount,
}: {
  locked: boolean;
  hasLoginAccount: boolean;
}) {
  if (!hasLoginAccount) {
    return <Badge variant="outline">未登録</Badge>;
  }

  return locked ? (
    <Badge variant="destructive">ロック中</Badge>
  ) : (
    <Badge variant="outline">正常</Badge>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "未ログイン";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
