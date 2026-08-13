"use client";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";

import type { StandardListCode } from "@/features/standard-codes/types";
import type { Reservation, ReservationFormValues } from "../../types";
import { buildEditReservationFormValues } from "../../utils/reservation-form";

type ReservationUpdateConfirmDialogProps = {
  open: boolean;
  reservation: Reservation;
  values: ReservationFormValues;

  requestedRestaurantMasterTypes: StandardListCode[];
  reservationRoutes: StandardListCode[];
  menuTypes: StandardListCode[];
  reservationOccasions: StandardListCode[];
  reservationStatuses: StandardListCode[];

  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

type ReservationChangeItem = {
  label: string;
  before: string;
  after: string;
};

function displayValue(value: string | null | undefined): string {
  return value?.trim() || "未入力";
}

function findOptionLabel(
  options: StandardListCode[],
  id: number | null,
): string {
  if (id === null) return "未選択";

  return options.find((option) => option.id === id)?.label ?? "不明";
}

function formatDateTime(value: string): string {
  const [date, time] = value.split("T");

  if (!date || !time) return value;

  return `${date.replaceAll("-", "/")} ${time}`;
}

// 予約更新時の文言を共通確認ダイアログへ設定する。
export function ReservationUpdateConfirmDialog({
  open,
  reservation,
  values,
  requestedRestaurantMasterTypes,
  reservationRoutes,
  menuTypes,
  reservationOccasions,
  reservationStatuses,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: ReservationUpdateConfirmDialogProps) {
  const originalValues = buildEditReservationFormValues(reservation);
  const changes: ReservationChangeItem[] = [];

  function addTextChange(label: string, before: string, after: string) {
    const normalizedBefore = before.trim();
    const normalizedAfter = after.trim();

    if (normalizedBefore === normalizedAfter) return;

    changes.push({
      label,
      before: displayValue(normalizedBefore),
      after: displayValue(normalizedAfter),
    });
  }

  if (originalValues.reservation_name !== values.reservation_name) {
    changes.push({
      label: "予約者名",
      before: displayValue(originalValues.reservation_name),
      after: displayValue(values.reservation_name),
    });
  }

  if (
    originalValues.reservation_phone_number !== values.reservation_phone_number
  ) {
    changes.push({
      label: "電話番号",
      before: displayValue(originalValues.reservation_phone_number),
      after: displayValue(values.reservation_phone_number),
    });
  }

  if (originalValues.starts_at !== values.starts_at) {
    changes.push({
      label: "開始日時",
      before: formatDateTime(originalValues.starts_at),
      after: formatDateTime(values.starts_at),
    });
  }

  if (originalValues.ends_at !== values.ends_at) {
    changes.push({
      label: "終了日時",
      before: formatDateTime(originalValues.ends_at),
      after: formatDateTime(values.ends_at),
    });
  }

  if (originalValues.guest_count !== values.guest_count) {
    changes.push({
      label: "予約人数",
      before: `${originalValues.guest_count}名`,
      after: `${values.guest_count}名`,
    });
  }

  if (
    originalValues.requested_restaurant_master_type_id !==
    values.requested_restaurant_master_type_id
  ) {
    changes.push({
      label: "希望席種",
      before: findOptionLabel(
        requestedRestaurantMasterTypes,
        originalValues.requested_restaurant_master_type_id,
      ),
      after: findOptionLabel(
        requestedRestaurantMasterTypes,
        values.requested_restaurant_master_type_id,
      ),
    });
  }

  if (originalValues.reservation_status_id !== values.reservation_status_id) {
    changes.push({
      label: "予約状況",
      before: findOptionLabel(
        reservationStatuses,
        originalValues.reservation_status_id,
      ),
      after: findOptionLabel(reservationStatuses, values.reservation_status_id),
    });
  }

  if (originalValues.reservation_route_id !== values.reservation_route_id) {
    changes.push({
      label: "予約経路",
      before: findOptionLabel(
        reservationRoutes,
        originalValues.reservation_route_id,
      ),
      after: findOptionLabel(reservationRoutes, values.reservation_route_id),
    });
  }

  if (originalValues.menu_type_id !== values.menu_type_id) {
    changes.push({
      label: "メニュー",
      before: findOptionLabel(menuTypes, originalValues.menu_type_id),
      after: findOptionLabel(menuTypes, values.menu_type_id),
    });
  }

  if (originalValues.occasion_id !== values.occasion_id) {
    changes.push({
      label: "利用目的",
      before: findOptionLabel(reservationOccasions, originalValues.occasion_id),
      after: findOptionLabel(reservationOccasions, values.occasion_id),
    });
  }

  addTextChange("アレルギー", originalValues.allergy_note, values.allergy_note);

  addTextChange(
    "苦手な食材",
    originalValues.disliked_food_note,
    values.disliked_food_note,
  );

  addTextChange(
    "好みの食材",
    originalValues.preferred_food_note,
    values.preferred_food_note,
  );

  addTextChange(
    "好みのドリンク",
    originalValues.favorite_drink_note,
    values.favorite_drink_note,
  );

  addTextChange("ご要望", originalValues.request_note, values.request_note);

  addTextChange("店舗メモ", originalValues.internal_memo, values.internal_memo);

  return (
    <ConfirmActionDialog
      open={open}
      title="予約内容を更新しますか？"
      description="入力内容を確認してから更新してください。"
      confirmLabel="更新する"
      submittingLabel="更新中…"
      confirmDisabled={changes.length === 0}
      isSubmitting={isSubmitting}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    >
      <div className="max-h-80 space-y-3 overflow-y-auto">
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
      </div>
    </ConfirmActionDialog>
  );
}
