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

  return (
    <div className="text-sm">
      <span className="font-medium">{staff.staff_master.name}</span>
    </div>
  );
}
