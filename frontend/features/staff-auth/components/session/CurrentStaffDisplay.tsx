"use client";

// このコンポーネントは、現在ログインしているスタッフの情報を表示するためのものです。
import { useAuth } from "@/features/staff-auth/hooks/use-auth";

export function CurrentStaffDisplay() {
  const { staff, status } = useAuth();

  if (status === "loading") {
    return <span className="text-sm text-muted-foreground">確認中...</span>;
  }

  if (status !== "authenticated" || !staff) {
    return null;
  }

  const roleLabel: Record<string, string> = {
    owner: "管理者（全操作）",
    operator: "顧客・予約の更新可",
    viewer: "閲覧専用",
  };

  return (
    <span className="grid text-sm">
      <span className="font-medium">{staff.staff_master.name}</span>
      <span className="text-xs text-muted-foreground">
        {roleLabel[staff.staff_master.role_code] ?? ""}
      </span>
    </span>
  );
}
