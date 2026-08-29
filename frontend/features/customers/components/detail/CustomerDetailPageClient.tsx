"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  Building2Icon,
  PencilIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api/api-client";

import { fetchCustomer } from "../../api/customer-api";
import type { Customer } from "../../types";
import { formatCustomerPhoneNumber } from "../../utils/customer-display";
import { CustomerFormDialog } from "../dialogs/CustomerFormDialog";

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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function customerKindLabel(customerKind: Customer["customer_kind"]) {
  return customerKind === "corporate" ? "法人" : "個人";
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

      <dd className="break-words text-sm leading-6 font-medium">{value}</dd>
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
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadCustomer() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchCustomer(customerId);

        if (isCancelled) {
          return;
        }

        setCustomer(response.data.customer);
      } catch (error) {
        if (isCancelled) {
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
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCustomer();

    return () => {
      isCancelled = true;
    };
  }, [customerId, reloadKey]);

  function handleEditCompleted() {
    setReloadKey((current) => current + 1);
  }

  if (isLoading) {
    return <CustomerDetailSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6">
        <Button asChild variant="outline">
          <Link href="/customers">
            <ArrowLeftIcon />
            顧客一覧へ戻る
          </Link>
        </Button>

        <Alert variant="destructive">
          <AlertTitle>顧客情報を表示できません</AlertTitle>

          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6">
      <Button asChild variant="outline">
        <Link href="/customers">
          <ArrowLeftIcon />
          顧客一覧へ戻る
        </Link>
      </Button>

      <Card className="gap-0 py-0">
        <CardHeader className="block border-b px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-semibold tracking-tight">
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

            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setEditDialogOpen(true)}
            >
              <PencilIcon />
              顧客情報を編集
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DetailSection
            title="顧客概要"
            description="接客時に確認する基本情報・連絡先・共有事項です。"
            icon={<UserIcon className="size-5" aria-hidden="true" />}
          >
            <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
              <DetailItem
                label="顧客区分"
                value={customerKindLabel(customer.customer_kind)}
              />

              <DetailItem label="顧客名" value={customer.name} />

              <DetailItem label="フリガナ" value={customer.kana} />

              <DetailItem
                label="生年月日"
                value={formatDate(customer.birthday)}
              />

              <DetailItem
                label="電話番号"
                value={formatCustomerPhoneNumber(customer.phone_number)}
              />

              <DetailItem
                label="メールアドレス"
                value={displayValue(customer.email)}
              />

              <DetailItem
                label="郵便番号"
                value={displayValue(customer.postal_code)}
              />

              <DetailItem
                label="住所"
                value={displayValue(customer.address)}
                wide
              />
            </dl>

            <div className="mt-8 border-t pt-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold">顧客メモ</h3>
                <span className="text-xs text-muted-foreground">
                  スタッフ共有
                </span>
              </div>

              <div className="min-h-24 rounded-lg border bg-muted/20 p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-7">
                  {displayValue(customer.memo)}
                </p>
              </div>
            </div>
          </DetailSection>

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
                  value={displayValue(customer.company_postal_code)}
                />

                <DetailItem
                  label="法人住所"
                  value={displayValue(customer.company_address)}
                  wide
                />
              </dl>
            </DetailSection>
          )}

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
        </CardContent>
      </Card>

      {editDialogOpen && (
        <CustomerFormDialog
          key={`detail-edit-${customer.id}-${customer.lock_version}`}
          open={editDialogOpen}
          mode="edit"
          customer={customer}
          allowVisibilityChange={true}
          onOpenChange={setEditDialogOpen}
          onCompleted={handleEditCompleted}
        />
      )}
    </div>
  );
}
