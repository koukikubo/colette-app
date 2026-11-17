"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Reservation, ReservationFormValues } from "../../types";
import { buildEditReservationFormValues } from "../../utils/reservation-form";
import {
  conflictingFields,
  mergeReservation,
  reservationFieldLabels,
  type ReservationField,
} from "../../utils/reservation-conflict";

export function ReservationConflictDialog({
  base,
  mine,
  latest,
  onClose,
  onApply,
  format,
}: {
  base: Reservation;
  mine: ReservationFormValues;
  latest: Reservation;
  onClose: () => void;
  onApply: (values: ReservationFormValues) => void;
  format?: (
    key: ReservationField,
    value: ReservationFormValues[ReservationField],
  ) => string;
}) {
  const previous = buildEditReservationFormValues(base);
  const current = buildEditReservationFormValues(latest);
  const conflicts = conflictingFields(previous, mine, current);
  const [choices, setChoices] = useState<
    Partial<Record<ReservationField, "mine" | "latest">>
  >({});
  const changed = (Object.keys(previous) as ReservationField[]).filter(
    (key) =>
      JSON.stringify(previous[key]) !== JSON.stringify(mine[key]) ||
      JSON.stringify(previous[key]) !== JSON.stringify(current[key]),
  );
  const changedState =
    latest.canceled_at !== base.canceled_at ||
    latest.completed_at !== base.completed_at;
  const display = (
    key: ReservationField,
    value: ReservationFormValues[ReservationField],
  ) =>
    format?.(key, value) ??
    (Array.isArray(value) ? value.join("、") : String(value ?? "未指定"));
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>予約の更新競合を確認</DialogTitle>
          <DialogDescription>
            最新の変更と自分の入力を比較します。双方が変更した項目を選び、再編集後に保存してください。
          </DialogDescription>
        </DialogHeader>
        {changedState && (
          <p role="alert">
            完了・キャンセル状態が変更されています。
            <Link className="underline" href={`/reservations/${latest.id}`}>
              最新の予約詳細
            </Link>
            で状態を確認してください。
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>項目</th>
                <th>編集開始時</th>
                <th>自分の入力</th>
                <th>最新の内容</th>
                <th>反映する値</th>
              </tr>
            </thead>
            <tbody>
              {changed.map((key) => (
                <tr key={key} className="border-t">
                  <th className="p-2">{reservationFieldLabels[key]}</th>
                  <td className="p-2 whitespace-pre-wrap">
                    {display(key, previous[key])}
                  </td>
                  <td className="p-2 whitespace-pre-wrap">
                    {display(key, mine[key])}
                  </td>
                  <td className="p-2 whitespace-pre-wrap">
                    {display(key, current[key])}
                  </td>
                  <td className="p-2">
                    {conflicts.includes(key) ? (
                      <fieldset>
                        <legend className="sr-only">
                          {reservationFieldLabels[key]}の選択
                        </legend>
                        {(["mine", "latest"] as const).map((side) => (
                          <label className="block" key={side}>
                            <input
                              type="radio"
                              name={`conflict-${key}`}
                              checked={choices[key] === side}
                              onChange={() =>
                                setChoices((old) => ({ ...old, [key]: side }))
                              }
                            />
                            {side === "mine" ? "自分の入力" : "最新の内容"}
                          </label>
                        ))}
                      </fieldset>
                    ) : (
                      "変更箇所を自動で統合"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          disabled={changedState || conflicts.some((key) => !choices[key])}
          onClick={() =>
            onApply(mergeReservation(previous, mine, current, choices))
          }
        >
          選択を反映して再編集
        </Button>
        <Link className="underline" href={`/reservations/${latest.id}`}>
          最新の予約詳細を開く
        </Link>
        <Button variant="outline" onClick={onClose}>
          入力を保持して閉じる
        </Button>
      </DialogContent>
    </Dialog>
  );
}
