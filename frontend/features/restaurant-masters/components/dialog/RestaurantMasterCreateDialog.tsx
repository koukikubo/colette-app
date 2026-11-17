"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import type { AutomaticSeatTypeOption } from "../../utils/automatic-seat-types";

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
import { createRestaurantMaster } from "../../api/restaurant-masters-api";

type RestaurantMasterCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableTypeOptions: AutomaticSeatTypeOption[];
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
  const [memo, setMemo] = useState("");
  const [active, setActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const submitting = useRef(false);

  function resetForm() {
    setTableTypeId("");
    setName("");
    setCapacity("1");
    setMemo("");
    setActive(true);
    setErrorMessage("");
    setSaved(false);
    setUncertain(false);
    setSavedCode(null);
    setRefreshFailed(false);
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
    if (submitting.current || saved || uncertain) return;
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

    if (!Number.isInteger(capacityNumber) || capacityNumber < 1) {
      setErrorMessage("定員は1以上の整数で入力してください。");
      return;
    }

    try {
      submitting.current = true;
      setIsSubmitting(true);

      const response = await createRestaurantMaster({
        restaurant_master: {
          restaurant_master_type_id: Number(tableTypeId),
          name: name.trim(),
          capacity: capacityNumber,
          active,
          memo: memo.trim() || null,
        },
      });

      // 保存確定後のGET失敗で新しい席を重複登録しない。
      setSavedCode(response.data.restaurant_master.code ?? null);
      setSaved(true);
      await refreshAfterSave();
    } catch (error) {
      // 通信切断・5xxでは保存済みか断定できないため、一覧確認へ進める。
      if (!(error instanceof ApiClientError) || error.status >= 500) {
        setUncertain(true);
      } else {
        setErrorMessage([error.message, ...error.errorMessages].join(" / "));
      }
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  async function refreshAfterSave() {
    setIsSubmitting(true);
    setRefreshFailed(false);
    try {
      await onCreated();
      resetForm();
      onOpenChange(false);
    } catch {
      setRefreshFailed(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (saved || uncertain)
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {saved ? "席情報は保存済みです" : "登録結果の確認が必要です"}
            </DialogTitle>
            <DialogDescription role={uncertain ? "alert" : undefined}>
              {saved
                ? `${savedCode ?? "席情報"}の登録は完了しています。登録し直す必要はありません。`
                : "登録できたか確認できません。一覧を再取得して、重複がないか確認してください。"}
            </DialogDescription>
          </DialogHeader>
          {refreshFailed && (
            <p role="alert">
              一覧の表示を更新できませんでした。再取得をお試しください。
            </p>
          )}
          <Button
            disabled={isSubmitting}
            onClick={() => void refreshAfterSave()}
          >
            表示を再取得
          </Button>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
          >
            閉じる
          </Button>
        </DialogContent>
      </Dialog>
    );

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

          <p className="mt-4 text-sm text-muted-foreground">
            席コードはテーブル席がT01から、カウンター席がC01から自動で連番になります。個室などの区別は席名に入力してください。
          </p>
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
