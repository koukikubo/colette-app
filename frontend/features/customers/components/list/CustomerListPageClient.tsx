"use client";

import { PermissionGate } from "@/features/staff-auth/components/session/PermissionGate";
import { useState } from "react";
import { PlusIcon, RefreshCwIcon, SearchXIcon, UsersIcon } from "lucide-react";

import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { queryPage, useUrlQuery } from "@/hooks/useUrlQuery";
import { useCustomerAnalytics } from "../../hooks/useCustomerAnalytics";
import { CustomerAnalyticsPanel } from "./CustomerAnalyticsPanel";

import {
  CUSTOMER_RF_STATES,
  type CustomerRfState,
  type Customer,
  type CustomerListParams,
} from "../../types";
import { useCustomerRankOptions } from "../../hooks/useCustomerRankOptions";
import { useCustomers } from "../../hooks/useCustomers";
import {
  CustomerFormDialog,
  type CustomerFormMode,
} from "../dialogs/CustomerFormDialog";
import { CustomerTable } from "./CustomerTable";
import { CustomerTableSkeleton } from "./CustomerTableSkeleton";
import { CustomerSearchForm } from "./CustomerSearchForm";
import { CustomerActiveFilters } from "./CustomerActiveFilters";
import { CustomerFilterValues } from "./CustomerFilterPopover";

// 異なる条件はAND。0回も有効で、既定の表示状態だけでは検索済みとしない。
function hasConditions(filters: CustomerListParams) {
  return Boolean(
    filters.query ||
    filters.customer_kind ||
    (filters.visibility && filters.visibility !== "visible") ||
    filters.customer_rank_id !== undefined ||
    filters.rf_rank_id !== undefined ||
    filters.rf_rank_state ||
    filters.last_visit_from ||
    filters.last_visit_to ||
    filters.min_visits !== undefined ||
    filters.max_visits !== undefined,
  );
}

export function CustomerListPageClient() {
  const { params, update } = useUrlQuery();
  const rankParam = params.get("customer_rank_id");
  // URLを正本として復元する。ランクIDと状態の同時指定はAPIに渡して拒否し、黙って片方を捨てない。
  const rfIdParam = params.get("rf_rank_id");
  const rfRankId =
    rfIdParam &&
    /^[1-9]\d*$/.test(rfIdParam) &&
    Number.isSafeInteger(Number(rfIdParam))
      ? Number(rfIdParam)
      : undefined;
  const rfStateParam = params.get("rf_rank_state");
  const rfRankState =
    rfStateParam && Object.hasOwn(CUSTOMER_RF_STATES, rfStateParam)
      ? (rfStateParam as CustomerRfState)
      : undefined;
  const customerRankId =
    rankParam === "unassigned"
      ? "unassigned"
      : rankParam &&
          /^[1-9]\d*$/.test(rankParam) &&
          Number.isSafeInteger(Number(rankParam))
        ? Number(rankParam)
        : undefined;
  const rankOptions = useCustomerRankOptions(customerRankId !== undefined);
  const filters: CustomerListParams = {
    last_visit_from: params.get("last_visit_from") || undefined,
    last_visit_to: params.get("last_visit_to") || undefined,
    min_visits: Boolean(params.get("min_visits"))
      ? Number(params.get("min_visits"))
      : undefined,
    max_visits: Boolean(params.get("max_visits"))
      ? Number(params.get("max_visits"))
      : undefined,
    customer_rank_id: customerRankId,
    rf_rank_id: rfRankId,
    rf_rank_state: rfRankState,
    visibility: ["visible", "hidden", "all"].includes(
      params.get("visibility") ?? "",
    )
      ? (params.get("visibility") as "visible" | "hidden" | "all")
      : "visible",
    customer_kind:
      params.get("customer_kind") === "individual" ||
      params.get("customer_kind") === "corporate"
        ? (params.get("customer_kind") as "individual" | "corporate")
        : undefined,
    query: params.get("query") || undefined,
  };
  const hasSearchConditions = hasConditions(filters);
  // 既存の条件付きURLも復元する。空欄での明示検索だけは全件のページング表示を許可する。
  const searchEnabled =
    hasSearchConditions ||
    params.get("searched") === "1" ||
    params.has("page") ||
    params.has("per_page");
  const analytics = useCustomerAnalytics(!searchEnabled);
  const [queryDraft, setQueryInput] = useState<string | null>(null);
  const queryInput = queryDraft ?? filters.query ?? "";
  function setFilters(
    next:
      | CustomerListParams
      | ((current: CustomerListParams) => CustomerListParams),
    explicit = false,
  ) {
    const value = typeof next === "function" ? next(filters) : next;
    const searching = explicit || hasConditions(value);
    update({
      searched: searching ? "1" : null,
      page: searching ? 1 : null,
      per_page: searching ? params.get("per_page") : null,
      last_visit_from: value.last_visit_from,
      last_visit_to: value.last_visit_to,
      min_visits: value.min_visits,
      max_visits: value.max_visits,
      visibility: value.visibility === "visible" ? null : value.visibility,
      customer_rank_id: value.customer_rank_id,
      rf_rank_id: value.rf_rank_id,
      rf_rank_state: value.rf_rank_state,
      customer_kind: value.customer_kind,
      query: value.query,
    });
  }

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const formMode: CustomerFormMode = selectedCustomer ? "edit" : "create";
  const [reloadKey, setReloadKey] = useState(0);

  const visibility = filters.visibility ?? "visible";
  const customerKind = filters.customer_kind;
  const appliedQuery = filters.query;
  const currentPage = queryPage(params.get("page"));
  const perPage = [20, 50, 100].includes(Number(params.get("per_page")))
    ? Number(params.get("per_page"))
    : 20;
  const setCurrentPage = (page: number) => update({ page });
  const {
    customers,
    pagination,
    rfReference: resultRfReference,
    isLoading,
    errorMessage,
    refresh,
  } = useCustomers({
    enabled: searchEnabled,
    last_visit_from: filters.last_visit_from,
    last_visit_to: filters.last_visit_to,
    min_visits: filters.min_visits,
    max_visits: filters.max_visits,
    visibility,
    customer_kind: customerKind,
    customer_rank_id: customerRankId,
    rf_rank_id: rfRankId,
    rf_rank_state: rfRankState,
    query: appliedQuery,
    page: currentPage,
    per_page: perPage,
    reloadKey,
  });

  const rfReference = resultRfReference ?? analytics.data?.rf_reference ?? null;

  function handleSearch() {
    const normalizedQuery = queryInput.trim();
    setQueryInput(null);

    setFilters(
      (current) => ({
        ...current,
        query: normalizedQuery.length > 0 ? normalizedQuery : undefined,
      }),
      true,
    );
  }

  function handleClearQuery() {
    setQueryInput(null);

    setFilters((current) => ({
      ...current,
      query: undefined,
    }));
  }

  function handleApplyFilters(nextFilters: CustomerFilterValues) {
    setQueryInput(null);

    setFilters((current) => ({
      ...current,
      query: queryInput.trim() || undefined,
      last_visit_from: nextFilters.last_visit_from,
      last_visit_to: nextFilters.last_visit_to,
      min_visits: nextFilters.min_visits,
      max_visits: nextFilters.max_visits,
      visibility: nextFilters.visibility,
      customer_rank_id: nextFilters.customerRankId,
      rf_rank_id: nextFilters.rfRankId,
      rf_rank_state: nextFilters.rfRankState,
      customer_kind: nextFilters.customerKind,
    }));
  }

  function handleResetVisibility() {
    setFilters((current) => ({
      ...current,
      visibility: "visible",
    }));
  }

  function handleClearCustomerKind() {
    setFilters((current) => ({
      ...current,
      customer_kind: undefined,
    }));
  }

  function handleClearAll() {
    setQueryInput(null);

    setFilters({
      visibility: "visible",
    });
  }

  function handlePerPageChange(nextPerPage: number) {
    update({ page: 1, per_page: nextPerPage });
  }

  function handleOpenCreateDialog() {
    setSavedNotice(false);
    setSelectedCustomer(null);
    setFormDialogOpen(true);
  }

  function handleOpenEditDialog(customer: Customer) {
    setSavedNotice(false);
    setSelectedCustomer(customer);
    setFormDialogOpen(true);
  }

  function handleFormDialogOpenChange(nextOpen: boolean) {
    setFormDialogOpen(nextOpen);

    if (!nextOpen) {
      setSelectedCustomer(null);
    }
  }

  async function handleCustomerFormCompleted() {
    await (searchEnabled ? refresh() : analytics.refresh());
    // 明細を開かない初期画面でも、登録・更新の保存成功を確認できるようにする。
    setSavedNotice(true);
  }

  function handleRetry() {
    setReloadKey((current) => current + 1);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {savedNotice && (
        <p role="status" className="rounded-xl bg-primary/10 px-5 py-3 text-sm">
          顧客情報を保存しました。
        </p>
      )}
      <section
        className="space-y-4 rounded-2xl bg-card p-5 shadow-sm sm:p-7"
        aria-label="顧客一覧の検索とページ操作"
      >
        <div>
          <h2 className="text-lg font-semibold">顧客検索</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            キーワードと絞り込み条件を組み合わせて検索できます。
          </p>
        </div>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start">
            <CustomerSearchForm
              value={queryInput}
              hasAppliedQuery={Boolean(filters.query)}
              visibility={visibility}
              customerKind={customerKind}
              customerRankId={customerRankId}
              rankOptions={rankOptions}
              rfRankId={rfRankId}
              rfRankState={rfRankState}
              rfReference={rfReference}
              visitFilters={filters}
              isLoading={isLoading}
              onValueChange={setQueryInput}
              onSearch={handleSearch}
              onClear={handleClearQuery}
              onApplyFilters={handleApplyFilters}
            />
            <PermissionGate resource="customers">
              <Button
                type="button"
                variant="outline"
                className="w-full shrink-0 sm:w-auto"
                onClick={handleOpenCreateDialog}
              >
                <PlusIcon />
                顧客を登録
              </Button>
            </PermissionGate>
          </div>

          {searchEnabled && !isLoading && !errorMessage && pagination && (
            <PaginationControls
              className="shrink-0"
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              totalCount={pagination.total_count}
              perPage={perPage}
              onPageChange={setCurrentPage}
              onPerPageChange={handlePerPageChange}
            />
          )}
        </div>

        {searchEnabled && !hasSearchConditions && (
          <Button type="button" variant="ghost" onClick={handleClearAll}>
            検索を終了
          </Button>
        )}
        <CustomerActiveFilters
          filters={filters}
          rfRankLabel={
            rfReference?.ranks.find((rank) => rank.id === rfRankId)?.label
          }
          onClearRf={() =>
            setFilters({
              ...filters,
              rf_rank_id: undefined,
              rf_rank_state: undefined,
            })
          }
          onClearVisits={() =>
            setFilters({
              ...filters,
              last_visit_from: undefined,
              last_visit_to: undefined,
              min_visits: undefined,
              max_visits: undefined,
            })
          }
          customerRankLabel={
            rankOptions.options.find((option) => option.id === customerRankId)
              ?.label
          }
          onClearCustomerRank={() => {
            setFilters((current) => ({
              ...current,
              customer_rank_id: undefined,
            }));
          }}
          onClearQuery={handleClearQuery}
          onResetVisibility={handleResetVisibility}
          onClearCustomerKind={handleClearCustomerKind}
          onClearAll={handleClearAll}
        />
      </section>

      {formDialogOpen && (
        <PermissionGate resource="customers">
          <CustomerFormDialog
            key={selectedCustomer ? `edit-${selectedCustomer.id}` : "create"}
            open={formDialogOpen}
            mode={formMode}
            customer={selectedCustomer}
            allowVisibilityChange={false}
            onOpenChange={handleFormDialogOpenChange}
            onCompleted={handleCustomerFormCompleted}
          />
        </PermissionGate>
      )}

      {!searchEnabled && (
        <CustomerAnalyticsPanel
          {...analytics}
          onRetry={() => void analytics.refresh().catch(() => undefined)}
        />
      )}
      {searchEnabled && isLoading && <CustomerTableSkeleton />}

      {searchEnabled && !isLoading && errorMessage && (
        <Alert variant="destructive" className="rounded-lg">
          <AlertTitle>顧客一覧を取得できませんでした</AlertTitle>

          <AlertDescription>
            <p>{errorMessage}</p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleRetry}
            >
              <RefreshCwIcon />
              再読み込み
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {searchEnabled &&
        !isLoading &&
        !errorMessage &&
        customers.length === 0 && (
          <div
            className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center"
            role="status"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {hasSearchConditions ? (
                <SearchXIcon className="size-6" aria-hidden="true" />
              ) : (
                <UsersIcon className="size-6" aria-hidden="true" />
              )}
            </div>

            <p className="text-base font-medium">
              {hasSearchConditions
                ? "検索条件に一致する顧客が見つかりません"
                : "顧客が登録されていません"}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {hasSearchConditions
                ? "検索条件を変更して、もう一度お試しください。"
                : "顧客が登録されると、ここに一覧表示されます。"}
            </p>
          </div>
        )}

      {searchEnabled && !isLoading && !errorMessage && customers.length > 0 && (
        <CustomerTable
          customers={customers}
          onEdit={handleOpenEditDialog}
          // 詳細から戻る際も、URLに保持した検索条件とページを復元する。
          returnPath={`/customers${params.size ? `?${params.toString()}` : ""}`}
        />
      )}

      {searchEnabled && !isLoading && !errorMessage && pagination && (
        <PaginationControls
          className="border-t pt-4"
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          totalCount={pagination.total_count}
          perPage={perPage}
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      )}
    </div>
  );
}
