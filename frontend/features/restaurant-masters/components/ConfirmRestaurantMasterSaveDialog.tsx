"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type {
  PendingRestaurantMasterValues,
  RestaurantMaster,
} from "@/features/restaurant-masters/types";

type ConfirmRestaurantMasterSaveDialogProps = {
  open: boolean;
  restaurantMaster: RestaurantMaster;
  pendingValues: PendingRestaurantMasterValues | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
};

type ChangeItem = {
  label: string;
  before: string;
  after: string;
};

export function ConfirmRestaurantMasterSaveDialog({
  open,
  restaurantMaster,
  pendingValues,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: ConfirmRestaurantMasterSaveDialogProps) {
  const changes: ChangeItem[] = [];

  if (pendingValues) {
    if (restaurantMaster.name !== pendingValues.name) {
      changes.push({
        label: "席名",
        before: restaurantMaster.name,
        after: pendingValues.name || "未入力",
      });
    }

    if (restaurantMaster.capacity !== pendingValues.capacity) {
      changes.push({
        label: "定員",
        before: `${restaurantMaster.capacity}名`,
        after: `${pendingValues.capacity}名`,
      });
    }

    if (restaurantMaster.active !== pendingValues.active) {
      changes.push({
        label: "有効状態",
        before: restaurantMaster.active ? "有効" : "無効",
        after: pendingValues.active ? "有効" : "無効",
      });
    }

    if ((restaurantMaster.memo ?? "") !== (pendingValues.memo ?? "")) {
      changes.push({
        label: "メモ",
        before: restaurantMaster.memo || "未入力",
        after: pendingValues.memo || "未入力",
      });
    }
  }

  const willBeDisabled =
    restaurantMaster.active && pendingValues?.active === false;

  const willBeEnabled =
    !restaurantMaster.active && pendingValues?.active === true;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>席マスタを更新しますか？</AlertDialogTitle>

          <AlertDialogDescription>
            以下の変更内容を確認してください。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          {changes.length > 0 ? (
            changes.map((change) => (
              <div key={change.label} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{change.label}</p>

                <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                  <span className="wrap-break-word text-muted-foreground">
                    {change.before}
                  </span>

                  <span aria-hidden="true">→</span>

                  <span className="wrap-break-word font-medium">
                    {change.after}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              変更された項目はありません。
            </p>
          )}

          {willBeDisabled ? (
            <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              無効にすると、この席は予約登録時の席候補として使用できなくなります。
            </p>
          ) : null}

          {willBeEnabled ? (
            <p className="rounded-lg border p-3 text-sm">
              有効にすると、この席を予約登録時の席候補として使用できるようになります。
            </p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>戻る</AlertDialogCancel>

          <Button
            type="button"
            disabled={isSubmitting || changes.length === 0}
            onClick={() => void onConfirm()}
          >
            {isSubmitting ? "更新中..." : "更新を確定する"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
