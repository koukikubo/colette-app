"use client";

import { useEffect, useMemo, useState } from "react";

import { AlertCircleIcon, PlusIcon, UsersRoundIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { fetchStaffMasters } from "../api/staff-master-api";
import type { StaffMaster } from "../types";
import { StaffMasterTable } from "./StaffMasterTable";
import { StaffMasterCreateDialog } from "./StaffMasterCreateDialog";
import { StaffMasterEditDialog } from "./StaffMasterEditDialog";

type ListMode = "active" | "retired";

export function StaffMasterManagementPage() {
  const [staffMasters, setStaffMasters] = useState<StaffMaster[]>([]);
  const [listMode, setListMode] = useState<ListMode>("active");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingStaffMaster, setEditingStaffMaster] =
    useState<StaffMaster | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchStaffMasters()
      .then((response) => {
        if (cancelled) return;

        setStaffMasters(response.data.staff_masters);
        setErrorMessage(null);
      })
      .catch(() => {
        if (cancelled) return;

        setErrorMessage("担当者情報を取得できませんでした。");
      })
      .finally(() => {
        if (cancelled) return;

        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleReload = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetchStaffMasters();

      setStaffMasters(response.data.staff_masters);
    } catch {
      setErrorMessage("担当者情報を取得できませんでした。");
    } finally {
      setIsLoading(false);
    }
  };

  const activeStaffMasters = useMemo(
    () => staffMasters.filter((staffMaster) => staffMaster.retired_on === null),
    [staffMasters],
  );

  const retiredStaffMasters = useMemo(
    () => staffMasters.filter((staffMaster) => staffMaster.retired_on !== null),
    [staffMasters],
  );

  const displayedStaffMasters =
    listMode === "active" ? activeStaffMasters : retiredStaffMasters;

  if (isLoading) {
    return <StaffMasterPageSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-4">
            <AlertCircleIcon
              className="size-8 text-destructive"
              aria-hidden="true"
            />

            <p className="text-sm text-muted-foreground">{errorMessage}</p>

            <Button type="button" variant="outline" onClick={handleReload}>
              再読み込み
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreated = async () => {
    const response = await fetchStaffMasters();

    setStaffMasters(response.data.staff_masters);
    setListMode("active");
  };

  const handleUpdated = async () => {
    const response = await fetchStaffMasters();

    setStaffMasters(response.data.staff_masters);
  };

  return (
    <div className="space-y-6">
      <PageHeader />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setListMode((currentMode) =>
              currentMode === "active" ? "retired" : "active",
            )
          }
        >
          <UsersRoundIcon aria-hidden="true" />

          {listMode === "active"
            ? `退職者リスト ${retiredStaffMasters.length}名`
            : `在籍中一覧 ${activeStaffMasters.length}名`}
        </Button>

        {listMode === "active" && (
          <Button type="button" onClick={() => setCreateDialogOpen(true)}>
            <PlusIcon aria-hidden="true" />
            新規登録
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {displayedStaffMasters.length === 0 ? (
            <EmptyState listMode={listMode} />
          ) : (
            <StaffMasterTable
              staffMasters={displayedStaffMasters}
              listMode={listMode}
              onEdit={setEditingStaffMaster}
            />
          )}
        </CardContent>
      </Card>

      <StaffMasterCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleCreated}
      />

      {editingStaffMaster && (
        <StaffMasterEditDialog
          key={editingStaffMaster.id}
          open
          staffMaster={editingStaffMaster}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setEditingStaffMaster(null);
            }
          }}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div className="space-y-1">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">担当者マスタ</h1>

        <p className="text-sm text-muted-foreground">
          担当者の基本情報、権限、ログイン状態を管理します。
        </p>
      </div>
    </div>
  );
}

function EmptyState({ listMode }: { listMode: ListMode }) {
  return (
    <div className="flex min-h-48 items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">
        {listMode === "active"
          ? "在籍中の担当者はいません。"
          : "退職済みの担当者はいません。"}
      </p>
    </div>
  );
}

function StaffMasterPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>

      <Skeleton className="h-72 w-full" />
    </div>
  );
}
