"use client";

import type { FormEvent } from "react";
import { useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ApiClientError } from "@/lib/api/api-client";
import { createRestaurantMaster } from "../api/restaurant-masters-api";

type RestaurantMasterTypeOption = {
  id: number;
  label: string;
};

type RestaurantMasterCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableTypeOptions: RestaurantMasterTypeOption[];
  onCreated: () => Promise<void> | void;
};

export function RestaurantMasterCreateDialog({
  open,
  onOpenChange,
  tableTypeOptions,
  onCreated,
}: RestaurantMasterCreateDialogProps) {
  const [tableTypeId, setTableTypeId] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [position, setPosition] = useState("1");
  const [memo, setMemo] = useState("");
  const [active, setActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setTableTypeId("");
    setName("");
    setCapacity("1");
    setPosition("1");
    setMemo("");
    setActive(true);
    setErrorMessage("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;

    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!tableTypeId) {
      setErrorMessage("席種を選択してください。");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("席名を入力してください。");
      return;
    }

    const capacityNumber = Number(capacity);
    const positionNumber = Number(position);

    if (!Number.isInteger(capacityNumber) || capacityNumber < 1) {
      setErrorMessage("定員は1以上の整数で入力してください。");
      return;
    }

    if (!Number.isInteger(positionNumber) || positionNumber < 1) {
      setErrorMessage("表示順は1以上の整数で入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);

      await createRestaurantMaster({
        restaurant_master: {
          restaurant_master_type_id: Number(tableTypeId),
          name: name.trim(),
          capacity: capacityNumber,
          active,
          position: positionNumber,
          memo: memo.trim() || null,
        },
      });

      await onCreated();

      resetForm();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage("席マスタの登録に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>席マスタを新規登録</DialogTitle>

            <DialogDescription>
              席種、席名、定員などを入力してください。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-6">
            <div className="grid gap-2">
              <label
                htmlFor="restaurant-master-type"
                className="text-sm font-medium"
              >
                席種
              </label>

              <Select
                value={tableTypeId}
                onValueChange={setTableTypeId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="restaurant-master-type">
                  <SelectValue placeholder="席種を選択してください" />
                </SelectTrigger>

                <SelectContent>
                  {tableTypeOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="restaurant-master-name"
                className="text-sm font-medium"
              >
                席名
              </label>

              <Input
                id="restaurant-master-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例：桜、個室A"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="restaurant-master-capacity"
                className="text-sm font-medium"
              >
                定員
              </label>

              <Input
                id="restaurant-master-capacity"
                type="number"
                min={1}
                step={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="restaurant-master-position"
                className="text-sm font-medium"
              >
                表示順
              </label>

              <Input
                id="restaurant-master-position"
                type="number"
                min={1}
                step={1}
                value={position}
                onChange={(event) => setPosition(event.target.value)}
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

              <Switch
                checked={active}
                onCheckedChange={setActive}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="restaurant-master-memo"
                className="text-sm font-medium"
              >
                メモ
              </label>

              <textarea
                id="restaurant-master-memo"
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
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "登録中..." : "登録する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
