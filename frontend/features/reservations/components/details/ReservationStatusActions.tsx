"use client";

import { useRef, useState } from "react";
import { formatReservationDateTimeLocal } from "../../utils/reservation-date";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/features/staff-auth/components/session/PermissionGate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ApiClientError } from "@/lib/api/api-client";
import {
  completeReservation,
  cancelReservation,
  noShowReservation,
  fetchReservation,
  correctReservationResult,
  confirmReservationDetails,
} from "../../api/reservation_api";
import { reservationResultLabel } from "../../utils/reservation-result";
import {
  ReservationCorrectionFields,
  type BookingCorrection,
} from "./ReservationCorrectionFields";
import type {
  Reservation,
  ReservationStatusActionRequest,
  VisitResult,
} from "../../types";

type Props = { reservation: Reservation; onStatusChanged?: () => void };
type Action = "checkout" | "cancel" | "no_show" | "correct";
type PendingOperation = {
  action: Action;
  key: string;
  payload: ReservationStatusActionRequest;
};

// 競合時には状態だけでなく、集計へ影響する日時・顧客・人数も比較する。
function describeReservation(reservation: Reservation): string {
  return `${reservationResultLabel(reservation)} / ${reservation.customer?.name ?? "顧客未指定"} / ${formatReservationDateTimeLocal(reservation.starts_at).replace("T", " ")}〜${formatReservationDateTimeLocal(reservation.ends_at).replace("T", " ")} / ${reservation.guest_count}名`;
}

function ReservationStatusActionsContent({
  reservation: initial,
  onStatusChanged,
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState<Reservation | null>(null);
  const reservation =
    saved && saved.lock_version >= initial.lock_version ? saved : initial;
  const [dialog, setDialog] = useState<Action | null>(null);
  const [result, setResult] = useState<VisitResult>("pending");
  const [reason, setReason] = useState("");
  const [editBooking, setEditBooking] = useState(false);
  const [booking, setBooking] = useState<BookingCorrection>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [conflict, setConflict] = useState(false);
  const inFlight = useRef(false);
  const pending = useRef<PendingOperation | null>(null);
  const processed = Boolean(
    reservation.completed_at || reservation.canceled_at,
  );
  const isNoShow = reservation.cancellation_kind === "no_show";
  const currentTime = useCurrentTime();
  const hasStarted =
    new Date(reservation.starts_at).getTime() <= currentTime.getTime();
  const tentative = reservation.reservation_status?.code === "tentative";
  const needsReason = dialog === "correct" && !isNoShow && result !== "no_show";

  // 保存成功後の再取得失敗を、保存失敗として再送させない。
  function refreshAfterSave() {
    try {
      window.dispatchEvent(new Event("colette:reservations-changed"));
      onStatusChanged?.();
      router.refresh();
    } catch {
      setNotice(
        "保存済みです。画面を再読み込みして最新情報を確認してください。",
      );
    }
  }

  // 応答を受け取れない場合は入力・版・キーを固定し、同じ操作だけを再送する。
  async function submit(action: Action) {
    if (inFlight.current) return;
    if (needsReason && !reason.trim()) {
      setMessage("訂正理由を入力してください。");
      return;
    }
    const operation = pending.current ?? {
      action,
      key: crypto.randomUUID(),
      payload: {
        reservation: {
          lock_version: reservation.lock_version,
          ...((action === "checkout" ||
            (action === "correct" && result === "checked_out")) &&
          tentative
            ? { confirm_tentative: true }
            : {}),
          ...(action === "correct"
            ? {
                visit_result: result,
                reason: needsReason ? reason.trim() : "",
                ...(editBooking ? { booking } : {}),
              }
            : {}),
        },
      },
    };
    pending.current = operation;
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    setNotice(null);
    const send =
      operation.action === "checkout"
        ? completeReservation
        : operation.action === "cancel"
          ? cancelReservation
          : operation.action === "no_show"
            ? noShowReservation
            : correctReservationResult;
    try {
      const response = await send(
        reservation.id,
        operation.payload,
        operation.key,
      );
      setSaved(response.data.reservation);
      pending.current = null;
      setUncertain(false);
      setDialog(null);
      setReason("");
      setNotice(
        "来店結果を保存しました。RFランクは次回の正常な日次計算後に反映されます。",
      );
      refreshAfterSave();
    } catch (error) {
      const ambiguous =
        !(error instanceof ApiClientError) || error.status >= 500;
      setUncertain(ambiguous);
      if (!ambiguous) pending.current = null;
      if (error instanceof ApiClientError && error.status === 409)
        setConflict(true);
      setMessage(
        ambiguous
          ? "保存結果を確認できません。同じ操作を再試行してください。二重には記録されません。"
          : error instanceof ApiClientError
            ? error.errorMessages.join(" / ") || error.message
            : "保存できませんでした。",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  // 詳細確認は来店実績とは独立した操作として維持する。
  async function confirmDetails() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const response = await confirmReservationDetails(reservation.id, {
        reservation: { lock_version: reservation.lock_version },
      });
      setSaved(response.data.reservation);
      refreshAfterSave();
    } catch (error) {
      setMessage(
        error instanceof ApiClientError
          ? error.message
          : "確認済みにできませんでした。",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  // 409では入力を残したまま最新結果を提示し、確認後に新しい版で再編集する。
  async function checkLatest() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const response = await fetchReservation(reservation.id);
      setNotice(
        `操作前：${describeReservation(reservation)} ／ 最新：${describeReservation(response.data.reservation)}。入力は保持しています。比較してから確定してください。`,
      );
      setSaved(response.data.reservation);
      setConflict(false);
      setMessage(null);
    } catch {
      setMessage("最新情報を取得できませんでした。入力は保持しています。");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function open(action: Action) {
    setMessage(null);
    setReason("");
    setResult("pending");
    setEditBooking(false);
    setBooking({});
    setDialog(action);
  }
  const title =
    dialog === "checkout"
      ? "予約確定と退店を同時に記録しますか？"
      : dialog === "cancel"
        ? "予約をキャンセルしますか？"
        : dialog === "no_show"
          ? "無断キャンセルを記録しますか？"
          : "来店結果を訂正";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {processed ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy || uncertain}
            onClick={() => open("correct")}
          >
            来店結果を訂正
          </Button>
        ) : (
          <>
            {!reservation.details_confirmed_at && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy || uncertain}
                onClick={() => void confirmDetails()}
              >
                内容を確認済みにする
              </Button>
            )}
            <Button
              size="sm"
              disabled={busy || uncertain || !hasStarted}
              onClick={() =>
                tentative ? open("checkout") : void submit("checkout")
              }
            >
              退店済にする
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy || uncertain}
              onClick={() => open("cancel")}
            >
              予約をキャンセル
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || uncertain || !hasStarted}
              onClick={() => open("no_show")}
            >
              無断キャンセル
            </Button>
          </>
        )}
        {uncertain && !dialog && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              pending.current && void submit(pending.current.action)
            }
          >
            同じ操作を再試行
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={busy || uncertain}
          onClick={() => void checkLatest()}
        >
          最新情報を確認
        </Button>
      </div>
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {message && !dialog && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      <AlertDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !busy && !uncertain) setDialog(null);
        }}
      >
        <AlertDialogContent className="max-h-[85dvh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog === "checkout"
                ? "仮予約を予約確定に変更し、退店済みとして来店実績に含めます。"
                : "操作担当者・日時・変更前後を記録します。退店処理日時は実際の退店時刻とは区別されます。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dialog === "correct" && (
            <div className="space-y-3">
              <Label htmlFor={`visit-result-${reservation.id}`}>
                訂正後の来店結果
              </Label>
              <select
                id={`visit-result-${reservation.id}`}
                className="w-full rounded-md border p-2"
                value={result}
                disabled={busy || uncertain}
                onChange={(event) =>
                  setResult(event.target.value as VisitResult)
                }
              >
                <option value="pending">未退店に戻す</option>
                <option value="checked_out">退店済</option>
                <option value="canceled">通常キャンセル</option>
                <option value="no_show">無断キャンセル</option>
              </select>
              {needsReason && (
                <>
                  <Label htmlFor={`result-reason-${reservation.id}`}>
                    訂正理由（必須）
                  </Label>
                  <Textarea
                    id={`result-reason-${reservation.id}`}
                    maxLength={1000}
                    value={reason}
                    disabled={busy || uncertain}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </>
              )}
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editBooking}
                  disabled={busy || uncertain}
                  onChange={(event) => setEditBooking(event.target.checked)}
                />
                予約情報も訂正する
              </Label>
              {editBooking && (
                <ReservationCorrectionFields
                  reservation={reservation}
                  value={booking}
                  onChange={setBooking}
                  disabled={busy || uncertain}
                />
              )}
              {result === "checked_out" && tentative && (
                <p className="text-sm">
                  確定すると、仮予約を予約確定に変更して退店を同時に記録します。
                </p>
              )}
              {!needsReason && (
                <p className="text-sm text-muted-foreground">
                  無断キャンセルに関わる訂正は理由入力不要です。
                </p>
              )}
            </div>
          )}
          {message && (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          )}
          {notice && <p className="text-sm">{notice}</p>}
          {conflict && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void checkLatest()}
            >
              最新内容を確認して訂正を続ける
            </Button>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy || uncertain}>
              戻る
            </AlertDialogCancel>
            <Button
              disabled={busy || conflict || (needsReason && !reason.trim())}
              onClick={() => dialog && void submit(dialog)}
            >
              {busy
                ? "保存中…"
                : uncertain
                  ? "同じ操作を再試行"
                  : dialog === "cancel"
                    ? "キャンセルを確定"
                    : "確定する"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// API側の認可に加え、閲覧専用ユーザーには結果の更新操作を表示しない。
export function ReservationStatusActions(props: Props) {
  return (
    <PermissionGate resource="reservations">
      <ReservationStatusActionsContent {...props} />
    </PermissionGate>
  );
}
