"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import type { RestaurantMaster } from "@/features/restaurant-masters/types";
import { ApiClientError } from "@/lib/api/api-client";
import { updateRestaurantMaster } from "../api/restaurant-masters-api";

type RestaurantMasterEditDialogProps = {
  open: boolean;
  restaurantMaster: RestaurantMaster;
  onOpenChange: (open: boolean) => void;
  onUpdated: (restaurantMaster: RestaurantMaster) => void;
};

export function RestaurantMasterEditDialog({
  open,
  restaurantMaster,
  onOpenChange,
  onUpdated,
}: RestaurantMasterEditDialogProps) {
  const [name, setName] = useState(restaurantMaster.name);
  const [capacity, setCapacity] = useState(String(restaurantMaster.capacity));
  const [memo, setMemo] = useState(restaurantMaster.memo ?? "");
  const [active, setActive] = useState(restaurantMaster.active);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;

    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("席名を入力してください。");
      return;
    }

    const capacityNumber = Number(capacity);

    if (!Number.isInteger(capacityNumber) || capacityNumber < 1) {
      setErrorMessage("定員は1以上の整数で入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await updateRestaurantMaster(restaurantMaster.id, {
        restaurant_master: {
          name: name.trim(),
          capacity: capacityNumber,
          active,
          memo: memo.trim() || null,
          lock_version: restaurantMaster.lock_version,
        },
      });

      onUpdated(response.data.restaurant_master);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage("席マスタの更新に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>席マスタを編集</DialogTitle>

            <DialogDescription>
              {restaurantMaster.code} の登録内容を編集します。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-6">
            <div className="grid gap-2">
              <label
                htmlFor="edit-restaurant-master-type"
                className="text-sm font-medium"
              >
                席種
              </label>

              <Input
                id="edit-restaurant-master-type"
                value={restaurantMaster.restaurant_master_type.label}
                disabled
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="edit-restaurant-master-name"
                className="text-sm font-medium"
              >
                席名
              </label>

              <Input
                id="edit-restaurant-master-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="edit-restaurant-master-capacity"
                className="text-sm font-medium"
              >
                定員
              </label>

              <Input
                id="edit-restaurant-master-capacity"
                type="number"
                min={1}
                step={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">有効状態</p>

                <p className="text-sm text-muted-foreground">
                  無効にすると通常の選択候補から除外されます。
                </p>
              </div>

              <Switch checked={active} onCheckedChange={setActive} />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="edit-restaurant-master-memo"
                className="text-sm font-medium"
              >
                メモ
              </label>

              <textarea
                id="edit-restaurant-master-memo"
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm"
                disabled={isSubmitting}
              />
            </div>
            {errorMessage ? (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "更新中..." : "更新する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
