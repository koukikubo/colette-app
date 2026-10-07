"use client";
import { useState } from "react";

import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";

import { RF_CALCULATION_STATUS_LABELS } from "../../constants";
import { useRfCalculationRunDetail } from "../../hooks/useRfCalculationRunDetail";

import { useAuth } from "@/features/staff-auth/hooks/use-auth";
import { ApiClientError } from "@/lib/api/api-client";

import {
  activateRfCalculationRun,
  fetchRfSettings,
  restoreRfCalculationRun,
} from "../../api/rf-management-api";
import { RfCalculationActivationDialog } from "./RfCalculationActivationDialog";
import { RfCalculationRestoreDialog } from "./RfCalculationRestoreDialog";

type RfCalculationRunDetailDrawerProps = {
  open: boolean;
  calculationRunId: number | null;
  onOpenChange: (open: boolean) => void;
  onApplied?: () => void;
};

function formatDate(date: string) {
  return date.replaceAll("-", "/");
}

function activationErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return "RF計算結果を適用できませんでした。";
  }

  if (error.status === 409) {
    return "この計算結果は古くなっているため適用できません。最新の条件でRF計算を再実行してください。";
  }

  return error.errorMessages[0] ?? error.message;
}

function restoreErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return "過去のRF計算結果を復元できませんでした。";
  }

  if (error.status === 409) {
    return "現在適用中のRFランクが変更されています。再読み込みして、もう一度操作してください。";
  }

  return error.errorMessages[0] ?? error.message;
}

export function RfCalculationRunDetailDrawer({
  open,
  calculationRunId,
  onOpenChange,
  onApplied,
}: RfCalculationRunDetailDrawerProps) {
  const { calculationRun, isLoading, errorMessage } = useRfCalculationRunDetail(
    open ? calculationRunId : null,
  );

  const { staff } = useAuth();
  const isOwner = staff?.staff_master.role_code === "owner";

  const [activationDialogOpen, setActivationDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const canActivate =
    isOwner &&
    calculationRun?.status === "completed" &&
    !calculationRun.current &&
    !calculationRun.restorable;
  const canRestore = isOwner && Boolean(calculationRun?.restorable);

  async function handleActivate() {
    if (!calculationRun) return;

    setIsActivating(true);
    setActivationError(null);

    try {
      await activateRfCalculationRun(calculationRun.id);

      setActivationDialogOpen(false);
      onOpenChange(false);
      onApplied?.();
    } catch (error) {
      setActivationError(activationErrorMessage(error));
    } finally {
      setIsActivating(false);
    }
  }

  async function handleRestore() {
    if (!calculationRun) return;

    setIsRestoring(true);
    setRestoreError(null);

    try {
      const settings = await fetchRfSettings();
      const currentRunId = settings.data.current_calculation_run?.id;

      if (!currentRunId) {
        throw new Error("現在適用中のRF計算結果がありません。");
      }

      await restoreRfCalculationRun(calculationRun.id, currentRunId);

      setRestoreDialogOpen(false);
      onOpenChange(false);
      onApplied?.();
    } catch (error) {
      setRestoreError(restoreErrorMessage(error));
    } finally {
      setIsRestoring(false);
    }
  }
  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="h-full w-full sm:max-w-2xl">
          <DrawerHeader className="border-b">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DrawerTitle>RF計算履歴の詳細</DrawerTitle>
                <DrawerDescription>
                  計算条件とランク別の集計結果を確認します。
                </DrawerDescription>
              </div>

              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="閉じる"
                >
                  <XIcon aria-hidden="true" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {isLoading && (
              <div role="status" className="space-y-4">
                <span className="sr-only">
                  RF計算履歴の詳細を読み込んでいます。
                </span>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            )}

            {!isLoading && errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            )}

            {!isLoading && !errorMessage && calculationRun && (
              <div className="space-y-6">
                <section aria-labelledby="calculation-summary-heading">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3
                      id="calculation-summary-heading"
                      className="font-semibold"
                    >
                      計算概要
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {RF_CALCULATION_STATUS_LABELS[calculationRun.status]}
                      </Badge>

                      {calculationRun.current && <Badge>現在適用中</Badge>}
                    </div>
                  </div>

                  <dl className="mt-3 grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        計算基準日
                      </dt>
                      <dd className="mt-1 font-medium">
                        {formatDate(calculationRun.base_date)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-muted-foreground">実行者</dt>
                      <dd className="mt-1 font-medium">
                        {calculationRun.started_by_staff?.name ?? "システム"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-muted-foreground">
                        集計開始日
                      </dt>
                      <dd className="mt-1 font-medium">
                        {formatDate(calculationRun.aggregation_started_on)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-muted-foreground">
                        来店回数の集計開始日
                      </dt>
                      <dd className="mt-1 font-medium">
                        {formatDate(calculationRun.frequency_started_on)}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section aria-labelledby="calculation-count-heading">
                  <h3 id="calculation-count-heading" className="font-semibold">
                    集計件数
                  </h3>

                  <dl className="mt-3 grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-4">
                      <dt className="text-xs text-muted-foreground">
                        対象顧客
                      </dt>
                      <dd className="mt-1 text-lg font-semibold">
                        対象 {calculationRun.customer_count}名
                      </dd>
                    </div>

                    <div className="rounded-lg border p-4">
                      <dt className="text-xs text-muted-foreground">対象外</dt>
                      <dd className="mt-1 text-lg font-semibold">
                        対象外 {calculationRun.excluded_count}名
                      </dd>
                    </div>

                    <div className="rounded-lg border p-4">
                      <dt className="text-xs text-muted-foreground">未分類</dt>
                      <dd className="mt-1 text-lg font-semibold">
                        未分類 {calculationRun.unmatched_count}名
                      </dd>
                    </div>
                  </dl>
                </section>

                <section aria-labelledby="rank-comparison-heading">
                  <h3 id="rank-comparison-heading" className="font-semibold">
                    ランク構成の変化
                  </h3>

                  {calculationRun.previous_run_id === null && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      初回計算のため、変更前の人数は0名として表示しています。
                    </p>
                  )}

                  {calculationRun.preview.rank_comparisons.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      ランク別の集計結果はありません。
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {calculationRun.preview.rank_comparisons.map(
                        (comparison) => (
                          <li
                            key={comparison.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                          >
                            <span className="font-medium">
                              {comparison.label}
                            </span>

                            <div className="flex items-center gap-2">
                              <span>{comparison.before_count}名</span>

                              <span aria-hidden="true">→</span>

                              <span className="font-semibold">
                                {comparison.after_count}名
                              </span>

                              <Badge
                                variant={
                                  comparison.delta === 0
                                    ? "outline"
                                    : "secondary"
                                }
                              >
                                {comparison.delta > 0 ? "+" : ""}
                                {comparison.delta}
                              </Badge>
                            </div>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </div>
          {(canActivate || canRestore) && (
            <DrawerFooter className="shrink-0 border-t bg-background">
              {canActivate && (
                <Button
                  type="button"
                  onClick={() => {
                    setActivationError(null);
                    setActivationDialogOpen(true);
                  }}
                >
                  計算結果を適用
                </Button>
              )}
              {canRestore && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRestoreError(null);
                    setRestoreDialogOpen(true);
                  }}
                >
                  この結果に戻す
                </Button>
              )}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>

      <RfCalculationActivationDialog
        open={activationDialogOpen}
        isSubmitting={isActivating}
        errorMessage={activationError}
        onOpenChange={(nextOpen) => {
          setActivationDialogOpen(nextOpen);

          if (!nextOpen) {
            setActivationError(null);
          }
        }}
        onConfirm={() => void handleActivate()}
      />

      <RfCalculationRestoreDialog
        open={restoreDialogOpen}
        isSubmitting={isRestoring}
        errorMessage={restoreError}
        onOpenChange={(nextOpen) => {
          setRestoreDialogOpen(nextOpen);

          if (!nextOpen) {
            setRestoreError(null);
          }
        }}
        onConfirm={() => void handleRestore()}
      />
    </>
  );
}
