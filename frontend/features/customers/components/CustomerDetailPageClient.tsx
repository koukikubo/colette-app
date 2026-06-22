"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api/api-client";

import { fetchCustomer } from "../api/customer-api";
import type { Customer } from "../types";
import { CustomerFormDialog } from "./CustomerFormDialog";

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
    <div className={wide ? "space-y-1 md:col-span-2" : "space-y-1"}>
      <dt className="text-sm text-muted-foreground">{label}</dt>

      <dd className="wrap-break-word text-sm font-medium">{value}</dd>
    </div>
  );
}

function DetailSection({ title, description, children }: DetailSectionProps) {
  return (
    <section className="space-y-5 rounded-lg border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {children}
    </section>
  );
}

function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-9 w-36" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-40" />
        </div>

        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
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
            error.errors.length > 0 ? ` ${error.errors.join(" / ")}` : "";

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
      <div className="space-y-6 p-6">
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
    <div className="space-y-6 p-6">
      <Button asChild variant="outline">
        <Link href="/customers">
          <ArrowLeftIcon />
          顧客一覧へ戻る
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {customer.name}
            </h1>

            <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
              {customerKindLabel(customer.customer_kind)}
            </span>

            <span
              className={
                customer.hidden
                  ? "rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
                  : "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              }
            >
              {customer.hidden ? "非表示" : "表示中"}
            </span>
          </div>

          <p className="text-muted-foreground">{customer.kana}</p>
        </div>

        <Button type="button" onClick={() => setEditDialogOpen(true)}>
          <PencilIcon />
          編集
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailSection
          title="基本情報"
          description="顧客を識別するための基本情報です。"
        >
          <dl className="grid gap-5 md:grid-cols-2">
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
          </dl>
        </DetailSection>

        <DetailSection title="連絡先" description="顧客本人の連絡先情報です。">
          <dl className="grid gap-5 md:grid-cols-2">
            <DetailItem
              label="電話番号"
              value={displayValue(customer.phone_number)}
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
        </DetailSection>

        {customer.customer_kind === "corporate" && (
          <DetailSection
            title="法人情報"
            description="法人に関する連絡先と所在地です。"
          >
            <dl className="grid gap-5 md:grid-cols-2">
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
                value={displayValue(customer.company_phone_number)}
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
        >
          <dl className="grid gap-5 md:grid-cols-2">
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
      </div>

      <DetailSection
        title="顧客メモ"
        description="顧客対応時に共有する情報です。"
      >
        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7">
          {displayValue(customer.memo)}
        </p>
      </DetailSection>

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
