"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import { PermissionGate } from "@/features/staff-auth/components/session/PermissionGate";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchReservations } from "../../../api/reservation_api";
import type { Reservation, ReservationListData } from "../../../types";
import { formatReservationDateTimeLocal } from "../../../utils/reservation-date";
import {
  bulkResultLabels,
  executeBulkResults,
  loadPendingReservations,
  prepareBulkResults,
  type BulkResultAction,
  type BulkResultItem,
} from "../../../utils/reservation-bulk-results";
import { ReservationStatusActions } from "../../details/ReservationStatusActions";

// 通常表示は表示日だけ。全期間は利用者が明示的に選択し、保存前に対象を確認する。
export function PendingCheckoutList({ targetDate }: { targetDate: string }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<ReservationListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Reservation[]>([]);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [action, setAction] = useState<BulkResultAction | "">("");
  const [batchAction, setBatchAction] = useState<BulkResultAction>("checkout");
  const [batch, setBatch] = useState<BulkResultItem[]>([]);
  const [dialog, setDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [confirmTentative, setConfirmTentative] = useState(false);
  const inFlight = useRef(false);
  const selectionRequest = useRef({
    revision: 0,
    controller: null as AbortController | null,
  });
  const locked = busy || selecting === targetDate || batch.length > 0;
  const uncertain = batch.some((item) => item.status === "uncertain");
  const retryable = batch.some((item) =>
    ["pending", "uncertain"].includes(item.status),
  );
  const tentativeCount = batch.filter(
    (item) => item.reservation.reservation_status?.code === "tentative",
  ).length;

  useEffect(() => {
    // 日付変更・アンマウント後に遅い全選択の応答で選択を復活させない。
    const requestState = selectionRequest.current;
    return () => {
      requestState.revision++;
      requestState.controller?.abort();
    };
  }, [targetDate]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchReservations(
          { state: "pending_checkout", date: targetDate, page, per_page: 20 },
          controller.signal,
        );
        if (!controller.signal.aborted) setData(response.data);
      } catch {
        if (!controller.signal.aborted)
          setError("退店未処理の予約を取得できませんでした。");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [open, targetDate, page, reload]);

  // 取得済みの予約と版を選択に保持する。画面外の選択も確認画面で全件表示する。
  async function selectAll(allDates: boolean) {
    const request = ++selectionRequest.current.revision;
    const controller = new AbortController();
    selectionRequest.current.controller = controller;
    setSelecting(targetDate);
    setError(null);
    try {
      const reservations = await loadPendingReservations(
        allDates ? undefined : targetDate,
        controller.signal,
      );
      if (request === selectionRequest.current.revision)
        setSelected(reservations);
    } catch {
      if (request === selectionRequest.current.revision)
        setError(
          "全選択の取得に失敗しました。元の選択は保持しています。再試行してください。",
        );
    } finally {
      if (request === selectionRequest.current.revision) setSelecting(null);
    }
  }

  function prepare() {
    if (!action) return;
    setBatch(prepareBulkResults(selected, action));
    setBatchAction(action);
    setStarted(false);
    setConfirmTentative(false);
    setDialog(true);
  }

  async function submit() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setStarted(true);
    try {
      await executeBulkResults(batch, batchAction, setBatch);
      // 一件でも保存され得るため、部分成功でも一覧を再取得する。再送本文は保持する。
      window.dispatchEvent(new Event("colette:reservations-changed"));
      setReload((value) => value + 1);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }

  // 未確認の保存結果がある間はキーを破棄しない。確定した失敗は再取得後に選び直す。
  function reset() {
    if (uncertain || busy) return;
    setBatch([]);
    if (started) setSelected([]);
    setDialog(false);
    setReload((value) => value + 1);
  }

  return (
    <section className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
      <Button
        variant="ghost"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        退店未処理の予約を確認
      </Button>
      {open && (
        <div className="space-y-3">
          <p className="text-sm">
            {targetDate}
            の予定終了を過ぎた未処理予約です。来店結果を確認して操作してください。
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || locked}
            onClick={() => setReload((value) => value + 1)}
          >
            未処理一覧を更新
          </Button>
          <PermissionGate resource="reservations">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={locked}
                onClick={() => void selectAll(false)}
              >
                表示日分を全選択
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={locked}
                onClick={() => void selectAll(true)}
              >
                過去分を含めて全選択
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={locked || !selected.length}
                onClick={() => setSelected([])}
              >
                選択を解除
              </Button>
              <span role="status">
                {selecting === targetDate
                  ? "選択対象を取得中…"
                  : `${selected.length}件選択中`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="bulk-reservation-result">一括処理の内容</label>
              <select
                id="bulk-reservation-result"
                className="rounded-md border bg-background p-2"
                disabled={locked}
                value={action}
                onChange={(event) =>
                  setAction(event.target.value as BulkResultAction | "")
                }
              >
                <option value="">処理内容を選択してください</option>
                {Object.entries(bulkResultLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Button
                disabled={locked || !selected.length || !action}
                onClick={prepare}
              >
                選択した予約の処理を確認
              </Button>
            </div>
            {!!batch.length && (
              <div role="status" className="space-y-2">
                <p>
                  成功{" "}
                  {batch.filter((item) => item.status === "success").length}件
                  ／ 失敗{" "}
                  {batch.filter((item) => item.status === "failed").length}件 ／
                  結果未確認{" "}
                  {batch.filter((item) => item.status === "uncertain").length}件
                  ／ 未送信{" "}
                  {batch.filter((item) => item.status === "pending").length}件
                </p>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setDialog(true)}
                >
                  一括処理の結果・再試行を確認
                </Button>
              </div>
            )}
          </PermissionGate>
          {error && <p role="alert">{error}</p>}
          {loading ? (
            <p role="status">読み込み中…</p>
          ) : (
            <>
              <ul className="space-y-3">
                {data?.reservations.map((reservation) => (
                  <li
                    key={reservation.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-background p-3"
                  >
                    <div className="flex items-center gap-3">
                      <PermissionGate resource="reservations">
                        <input
                          type="checkbox"
                          aria-label={`${reservation.reservation_name}を選択`}
                          disabled={locked}
                          checked={selected.some(
                            (item) => item.id === reservation.id,
                          )}
                          onChange={(event) =>
                            setSelected((items) =>
                              event.target.checked
                                ? [
                                    ...items.filter(
                                      (item) => item.id !== reservation.id,
                                    ),
                                    reservation,
                                  ]
                                : items.filter(
                                    (item) => item.id !== reservation.id,
                                  ),
                            )
                          }
                        />
                      </PermissionGate>
                      <Link
                        className="underline"
                        href={`/reservations/detail/${reservation.id}`}
                      >
                        {reservation.reservation_name} ／{" "}
                        {formatReservationDateTimeLocal(
                          reservation.starts_at,
                        ).replace("T", " ")}{" "}
                        ／ {reservation.reservation_status?.label}
                      </Link>
                    </div>
                    {!locked && (
                      <ReservationStatusActions
                        reservation={reservation}
                        onStatusChanged={() => {
                          setSelected([]);
                          setReload((value) => value + 1);
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
              {data?.reservations.length === 0 && (
                <p>表示日の退店未処理の予約はありません。</p>
              )}
              {data?.pagination && (
                <PaginationControls
                  currentPage={page}
                  totalPages={data.pagination.total_pages}
                  totalCount={data.pagination.total_count}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      )}
      <AlertDialog
        open={dialog}
        onOpenChange={(value) => {
          if (!busy) setDialog(value);
        }}
      >
        <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {batch.length}件の予約を{bulkResultLabels[batchAction]}
            </AlertDialogTitle>
            <AlertDialogDescription>
              選択した予約だけを処理します。予約ごとに保存し、失敗した予約は変更しません。退店・取消の変更は来店集計と次回RF計算へ影響します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul
            className="max-h-60 space-y-2 overflow-y-auto text-sm"
            aria-label="一括処理の対象予約"
          >
            {batch.map((item) => (
              <li key={item.reservation.id}>
                {!started && (
                  <label className="mr-2 inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked
                      aria-label={`${item.reservation.reservation_name}を一括対象から外す`}
                      onChange={() => {
                        setBatch((items) =>
                          items.filter(
                            (entry) =>
                              entry.reservation.id !== item.reservation.id,
                          ),
                        );
                        setSelected((items) =>
                          items.filter(
                            (entry) => entry.id !== item.reservation.id,
                          ),
                        );
                      }}
                    />
                    対象
                  </label>
                )}
                {item.reservation.reservation_name} ／{" "}
                {formatReservationDateTimeLocal(
                  item.reservation.starts_at,
                ).replace("T", " ")}{" "}
                ／ {item.reservation.reservation_status?.label}
                {started && (
                  <span>
                    {" "}
                    ：
                    {
                      {
                        pending: "未送信",
                        success: "成功",
                        failed: "失敗",
                        uncertain: "結果未確認",
                      }[item.status]
                    }
                    {item.error && `（${item.error}）`}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {batchAction === "checkout" && tentativeCount > 0 && (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmTentative}
                disabled={started}
                onChange={(event) => setConfirmTentative(event.target.checked)}
              />
              仮予約{tentativeCount}
              件を予約確定に変更し、退店済として記録することを確認しました
            </label>
          )}
          {uncertain && (
            <p role="alert">
              保存結果が未確認の予約があります。同じ操作を再試行してください。成功済みの予約は再送しません。
            </p>
          )}
          {busy && (
            <p role="status">
              処理中… {batch.filter((item) => item.status === "success").length}{" "}
              / {batch.length}件成功
            </p>
          )}
          <AlertDialogFooter className="flex-wrap">
            <AlertDialogCancel disabled={busy}>閉じる</AlertDialogCancel>
            {!uncertain && (
              <Button variant="outline" disabled={busy} onClick={reset}>
                {started ? "結果を確認して選び直す" : "選択へ戻る"}
              </Button>
            )}
            <PermissionGate resource="reservations">
              <Button
                disabled={
                  busy ||
                  !retryable ||
                  (batchAction === "checkout" &&
                    tentativeCount > 0 &&
                    !confirmTentative)
                }
                onClick={() => void submit()}
              >
                {started
                  ? "未送信・結果未確認分を同じ操作で再試行"
                  : "確認した内容で実行"}
              </Button>
            </PermissionGate>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
