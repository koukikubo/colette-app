"use client";

import { useReadRefresh } from "@/hooks/useReadRefresh";
import { useUrlQuery } from "@/hooks/useUrlQuery";
import { safeReturnPath } from "@/lib/api/session-events";
import { PermissionGate } from "@/features/staff-auth/components/session/PermissionGate";
import Link from "next/link";
import { Tabs } from "radix-ui";
import { useCustomerDetailDraftGuard } from "./useCustomerDetailDraftGuard";
import { CustomerDetailFields } from "./CustomerDetailFields";
import { CustomerStaffMemo } from "./CustomerStaffMemo";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  Building2Icon,
  PencilIcon,
  ShieldCheckIcon,
  ChartNoAxesCombinedIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api/api-client";

import { fetchCustomer } from "../../api/customer-api";
import {
  CUSTOMER_RF_STATES,
  type Customer,
  type CustomerDetail,
} from "../../types";
import {
  formatCustomerPhoneNumber,
  formatCustomerPostalCode,
} from "../../utils/customer-display";
import { CustomerFormDialog } from "../dialogs/CustomerFormDialog";
import { CustomerReservationHistory } from "./CustomerReservationHistory";

type CustomerDetailPageClientProps = {
  customerId: number;
};

type DetailItemProps = {
  label: string;
  value: ReactNode;
  wide?: boolean;
};

type DetailSectionProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
};

function displayValue(value: string | null | undefined) {
  return value?.trim() || "-";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function customerKindLabel(customerKind: Customer["customer_kind"]) {
  return customerKind === "corporate" ? "法人" : "個人";
}

// RFの計算有無とルール未一致を分け、一覧と同じ分類名を表示する。
function rfRankDisplayValue(customer: CustomerDetail) {
  return CUSTOMER_RF_STATES[customer.rf_rank_state];
}

function rfExclusionReasonMessage(reason: string) {
  if (reason === "manual_customer_rank") {
    return "手動の顧客ランクが設定されているため、RF計算の対象外です。";
  }

  return `RF計算の対象外です。（理由: ${reason}）`;
}

function DetailItem({ label, value, wide = false }: DetailItemProps) {
  return (
    <div
      className={
        wide
          ? "min-w-0 space-y-1.5 sm:col-span-2 xl:col-span-3"
          : "min-w-0 space-y-1.5"
      }
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>

      <dd className="wrap-break-word text-sm leading-6 font-medium">{value}</dd>
    </div>
  );
}

function DetailSection({
  title,
  description,
  icon,
  children,
}: DetailSectionProps) {
  return (
    <section className="border-b last:border-b-0">
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {icon}
          </div>

          <div>
            <h2 className="font-semibold">{title}</h2>

            {description && (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 min-w-0">{children}</div>
      </div>
    </section>
  );
}

function CustomerDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6">
      <Skeleton className="h-9 w-36" />

      <Card className="gap-0 py-0">
        <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
          <div className="space-y-3">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-5 w-40" />
          </div>

          <Skeleton className="h-9 w-24" />
        </div>

        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="space-y-6 border-b p-5 last:border-b-0 sm:p-6 lg:p-8"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 shrink-0 rounded-lg" />

              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// 顧客詳細ページ
export function CustomerDetailPageClient({
  customerId,
}: CustomerDetailPageClientProps) {
  const { params: returnParams, update: updateQuery } = useUrlQuery();
  const requestedTab = returnParams.get("tab");
  const tab =
    requestedTab && ["details", "history", "memo", "rf"].includes(requestedTab)
      ? requestedTab
      : "details";
  const [fieldsVisited, setFieldsVisited] = useState(tab === "details");
  const [historyVisited, setHistoryVisited] = useState(tab === "history");
  const [fieldsEditing, setFieldsEditing] = useState(false);
  const [memoEditing, setMemoEditing] = useState(false);
  const hasDetailInput = fieldsEditing || memoEditing;
  useCustomerDetailDraftGuard(hasDetailInput);
  const backTarget = returnParams.get("return_to")
    ? safeReturnPath(returnParams.get("return_to"))
    : "/customers";
  // RF履歴の内訳と一般顧客一覧を混同させず、実際の戻り先に合わせて案内する。
  const backLabel = backTarget.startsWith("/rf-customers")
    ? "RFの顧客内訳に戻る"
    : "顧客一覧へ戻る";
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const readGeneration = useRef(0);

  useReadRefresh(
    () => setReloadKey((value) => value + 1),
    !editDialogOpen && !hasDetailInput,
  );

  useEffect(() => {
    let isCancelled = false;
    const generation = ++readGeneration.current;
    const isCurrentRead = () =>
      !isCancelled && generation === readGeneration.current;

    async function loadCustomer() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchCustomer(customerId);

        if (!isCurrentRead()) {
          return;
        }

        setCustomer(response.data.customer);
      } catch (error) {
        if (!isCurrentRead()) {
          return;
        }

        if (error instanceof ApiClientError) {
          if (error.status === 404) {
            setErrorMessage("指定された顧客が見つかりませんでした。");
            return;
          }

          const details =
            error.errorMessages.length > 0
              ? ` ${error.errorMessages.join(" / ")}`
              : "";

          setErrorMessage(
            `顧客情報を取得できませんでした。` +
              `（HTTP ${error.status}）` +
              `${error.message}${details}`,
          );

          return;
        }

        setErrorMessage("顧客情報の取得中に予期しないエラーが発生しました。");
      } finally {
        if (isCurrentRead()) {
          setIsLoading(false);
        }
      }
    }

    void loadCustomer();

    return () => {
      isCancelled = true;
    };
  }, [customerId, reloadKey]);

  async function handleEditCompleted() {
    // 保存前に始まった背景GETを無効化し、保存後の読取だけを表示へ採用する。
    const generation = ++readGeneration.current;
    try {
      const response = await fetchCustomer(customerId);
      if (generation !== readGeneration.current) return;
      setCustomer(response.data.customer);
      setErrorMessage(null);
    } finally {
      if (generation === readGeneration.current) setIsLoading(false);
    }
  }

  if (isLoading && !customer) {
    return <CustomerDetailSkeleton />;
  }

  if (errorMessage && !customer) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6">
        <Button asChild variant="outline">
          <Link href={backTarget}>
            <ArrowLeftIcon />
            {backLabel}
          </Link>
        </Button>

        <Alert variant="destructive">
          <AlertTitle>顧客情報を表示できません</AlertTitle>

          <AlertDescription>
            <p>{errorMessage}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              再読み込み
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6"
      aria-busy={isLoading}
    >
      {/* 背景取得の失敗でも既存の履歴・ページ位置を残す。 */}
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <Button asChild variant="outline">
        <Link href={backTarget}>
          <ArrowLeftIcon />
          {backLabel}
        </Link>
      </Button>

      <Card className="gap-0 py-0">
        <CardHeader className="block border-b px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="wrap-break-word text-2xl font-semibold tracking-tight">
                  {customer.name}
                </h1>

                <Badge
                  variant={
                    customer.customer_kind === "corporate"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {customerKindLabel(customer.customer_kind)}
                </Badge>

                <Badge
                  variant={customer.hidden ? "secondary" : "outline"}
                  className={
                    customer.hidden
                      ? undefined
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }
                >
                  {customer.hidden ? "非表示" : "表示中"}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{customer.kana}</p>
                <p className="text-xs text-muted-foreground">
                  顧客ID #{customer.id}
                </p>
              </div>
            </div>

            <PermissionGate resource="customers">
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={hasDetailInput}
                onClick={() => setEditDialogOpen(true)}
              >
                <PencilIcon />
                顧客情報を編集
              </Button>
            </PermissionGate>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div
            className="flex flex-wrap gap-8 px-6 pt-5"
            aria-label="顧客のランク概要"
          >
            <div>
              <p className="text-xs text-muted-foreground">RFランク</p>
              <span className="mt-1 inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1 text-lg font-semibold">
                <span
                  className="size-3 rounded-full"
                  aria-hidden="true"
                  style={{
                    backgroundColor: /^#[0-9a-f]{6}$/i.test(
                      customer.current_rf_rank?.display_color ?? "",
                    )
                      ? customer.current_rf_rank!.display_color!
                      : "#64748B",
                  }}
                />
                {customer.current_rf_rank?.label.replace(/ランク$/, "") ?? "—"}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">顧客ランク</p>
              <span className="mt-1 inline-block rounded-lg bg-muted px-3 py-1 text-lg font-semibold">
                {customer.customer_rank?.label.replace(/ランク$/, "") ??
                  "未設定"}
              </span>
            </div>
          </div>
          <dl className="grid gap-x-8 gap-y-4 px-6 py-5 sm:grid-cols-2">
            <DetailItem
              label="電話番号"
              value={
                <span className="inline-flex items-center gap-2">
                  <PhoneIcon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {formatCustomerPhoneNumber(customer.phone_number)}
                </span>
              }
            />
            <DetailItem
              label="メールアドレス"
              value={
                <span className="inline-flex items-center gap-2 wrap-anywhere">
                  <MailIcon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {displayValue(customer.email)}
                </span>
              }
            />
            <DetailItem
              label="郵便番号"
              value={formatCustomerPostalCode(customer.postal_code)}
            />
            <DetailItem
              label="生年月日"
              value={formatDate(customer.birthday)}
            />
            <DetailItem
              label="住所"
              value={
                <span className="inline-flex items-start gap-2">
                  <MapPinIcon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {displayValue(customer.address)}
                </span>
              }
              wide
            />
          </dl>

          {customer.customer_kind === "corporate" && (
            <DetailSection
              title="法人情報"
              description="法人に関する連絡先と所在地です。"
              icon={<Building2Icon className="size-5" aria-hidden="true" />}
            >
              <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                <DetailItem
                  label="法人名"
                  value={displayValue(customer.company_name)}
                />

                <DetailItem
                  label="法人名カナ"
                  value={displayValue(customer.company_name_kana)}
                />

                <DetailItem
                  label="法人電話番号"
                  value={formatCustomerPhoneNumber(
                    customer.company_phone_number,
                  )}
                />

                <DetailItem
                  label="法人メールアドレス"
                  value={displayValue(customer.company_email)}
                />

                <DetailItem
                  label="法人郵便番号"
                  value={formatCustomerPostalCode(customer.company_postal_code)}
                />

                <DetailItem
                  label="法人住所"
                  value={displayValue(customer.company_address)}
                  wide
                />
              </dl>
            </DetailSection>
          )}
        </CardContent>
      </Card>
      <Tabs.Root
        value={tab}
        onValueChange={(value) => {
          if (value === "history") setHistoryVisited(true);
          if (value === "details") setFieldsVisited(true);
          updateQuery({ tab: value });
        }}
        className="space-y-4"
      >
        <Tabs.List
          aria-label="顧客詳細"
          className="flex w-fit max-w-full flex-wrap gap-1 rounded-xl bg-muted p-1"
        >
          {[
            ["details", "詳細情報"],
            ["history", "予約・来店履歴"],
            ["memo", "スタッフメモ"],
            ["rf", "RF分析"],
          ].map(([value, label]) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground outline-offset-2 data-[state=active]:bg-background data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content
          value="details"
          forceMount
          className="space-y-4 rounded-xl bg-card p-5 data-[state=inactive]:hidden sm:p-6"
        >
          {(fieldsVisited || tab === "details") && (
            <CustomerDetailFields
              key={customer.id}
              customerId={customer.id}
              onEditingChange={setFieldsEditing}
              customerVersion={customer.lock_version}
              editingDisabled={memoEditing}
              onSaved={handleEditCompleted}
            />
          )}
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground">
              登録・更新情報
            </summary>
            <DetailSection
              title="管理情報"
              description="登録・更新を行った担当者と日時です。"
              icon={<ShieldCheckIcon className="size-5" aria-hidden="true" />}
            >
              <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                <DetailItem
                  label="表示状態"
                  value={customer.hidden ? "非表示" : "表示中"}
                />

                <DetailItem
                  label="登録担当者"
                  value={displayValue(customer.created_by_staff?.name)}
                />

                <DetailItem
                  label="最終更新担当者"
                  value={displayValue(customer.updated_by_staff?.name)}
                />

                <DetailItem
                  label="登録日時"
                  value={formatDateTime(customer.created_at)}
                />

                <DetailItem
                  label="最終更新日時"
                  value={formatDateTime(customer.updated_at)}
                />

                <DetailItem
                  label="更新バージョン"
                  value={String(customer.lock_version)}
                />
              </dl>
            </DetailSection>
          </details>
        </Tabs.Content>
        <Tabs.Content
          value="history"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          {(historyVisited || tab === "history") && (
            <CustomerReservationHistory customerId={customer.id} />
          )}
        </Tabs.Content>
        <Tabs.Content
          value="memo"
          forceMount
          className="rounded-xl bg-card p-5 data-[state=inactive]:hidden sm:p-6"
        >
          <CustomerStaffMemo
            key={customer.id}
            customer={customer}
            onEditingChange={setMemoEditing}
            editingDisabled={fieldsEditing}
            onSaved={(updated) => {
              // メモ保存より前の背景GETは、保存後の表示へ採用しない。
              readGeneration.current += 1;
              setCustomer((current) =>
                current ? { ...current, ...updated } : current,
              );
              setIsLoading(false);
              setErrorMessage(null);
            }}
          />
        </Tabs.Content>
        <Tabs.Content
          value="rf"
          forceMount
          className="rounded-xl bg-card data-[state=inactive]:hidden"
        >
          <DetailSection
            title="顧客ランク"
            description="手動設定の顧客ランクと、来店履歴から計算されたRFランクです。"
            icon={
              <ChartNoAxesCombinedIcon className="size-5" aria-hidden="true" />
            }
          >
            {!customer.rf_rank_basis && (
              <p className="mt-6 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                {customer.rf_rank_state === "no_applied_run"
                  ? "現在適用中のRF計算履歴はありません。"
                  : "この顧客は現在適用中のRF計算に含まれていません。"}
              </p>
            )}

            {customer.rf_rank_state === "excluded" &&
              customer.rf_rank_basis?.exclusion_reason && (
                <Alert className="mt-6">
                  <AlertTitle>RF計算対象外</AlertTitle>

                  <AlertDescription>
                    {rfExclusionReasonMessage(
                      customer.rf_rank_basis.exclusion_reason,
                    )}
                  </AlertDescription>
                </Alert>
              )}

            <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
              <DetailItem
                label="現在のRFランク"
                value={
                  customer.current_rf_rank ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: /^#[0-9a-f]{6}$/i.test(
                            customer.current_rf_rank.display_color ?? "",
                          )
                            ? customer.current_rf_rank.display_color!
                            : "#64748B",
                        }}
                      />
                      <span>
                        {customer.rf_rank_state === "no_visit"
                          ? `来店履歴なし：${customer.current_rf_rank.label}`
                          : customer.current_rf_rank.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        （{customer.current_rf_rank.display_code}）
                      </span>
                    </span>
                  ) : (
                    rfRankDisplayValue(customer)
                  )
                }
              />

              {customer.rf_rank_basis && (
                <>
                  <DetailItem
                    label="RF計算基準日"
                    value={formatDate(customer.rf_rank_basis.base_date)}
                  />

                  <DetailItem
                    label="最終来店日"
                    value={formatDate(customer.rf_rank_basis.last_visit_on)}
                  />

                  <DetailItem
                    label="最終来店からの経過日数"
                    value={
                      customer.rf_rank_basis.recency_days === null
                        ? "-"
                        : `${customer.rf_rank_basis.recency_days}日`
                    }
                  />

                  <DetailItem
                    label="期間内の来店回数"
                    value={
                      customer.rf_rank_basis.frequency_count === null
                        ? "-"
                        : `${customer.rf_rank_basis.frequency_count}回`
                    }
                  />
                </>
              )}
            </dl>
          </DetailSection>
        </Tabs.Content>
      </Tabs.Root>

      {editDialogOpen && (
        <PermissionGate resource="customers">
          <CustomerFormDialog
            key={`detail-edit-${customer.id}`}
            open={editDialogOpen}
            mode="edit"
            customer={customer}
            allowVisibilityChange={true}
            onOpenChange={setEditDialogOpen}
            onCompleted={handleEditCompleted}
          />
        </PermissionGate>
      )}
    </div>
  );
}
