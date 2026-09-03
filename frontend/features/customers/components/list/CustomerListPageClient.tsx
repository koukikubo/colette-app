"use client";

import { useState } from "react";
import { PlusIcon, RefreshCwIcon, SearchXIcon, UsersIcon } from "lucide-react";

import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/usePagination";

import type { Customer, CustomerListParams } from "../../types";
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

export function CustomerListPageClient() {
  const [queryInput, setQueryInput] = useState("");

  const [filters, setFilters] = useState<CustomerListParams>({
    visibility: "visible",
  });

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const formMode: CustomerFormMode = selectedCustomer ? "edit" : "create";
  const [reloadKey, setReloadKey] = useState(0);

  const visibility = filters.visibility ?? "visible";
  const customerKind = filters.customer_kind;
  const appliedQuery = filters.query;
  const { currentPage, perPage, setCurrentPage, setPerPage, resetPage } =
    usePagination();
  const { customers, pagination, isLoading, errorMessage } = useCustomers({
    visibility,
    customer_kind: customerKind,
    query: appliedQuery,
    page: currentPage,
    per_page: perPage,
    reloadKey,
  });

  function handleSearch() {
    const normalizedQuery = queryInput.trim();

    resetPage();

    setFilters((current) => ({
      ...current,
      query: normalizedQuery.length > 0 ? normalizedQuery : undefined,
    }));
  }

  function handleClearQuery() {
    setQueryInput("");
    resetPage();

    setFilters((current) => ({
      ...current,
      query: undefined,
    }));
  }

  function handleApplyFilters(nextFilters: CustomerFilterValues) {
    resetPage();

    setFilters((current) => ({
      ...current,
      visibility: nextFilters.visibility,
      customer_kind: nextFilters.customerKind,
    }));
  }

  function handleResetVisibility() {
    resetPage();

    setFilters((current) => ({
      ...current,
      visibility: "visible",
    }));
  }

  function handleClearCustomerKind() {
    resetPage();

    setFilters((current) => ({
      ...current,
      customer_kind: undefined,
    }));
  }

  function handleClearAll() {
    setQueryInput("");
    resetPage();

    setFilters({
      visibility: "visible",
    });
  }

  function handlePerPageChange(nextPerPage: number) {
    resetPage();
    setPerPage(nextPerPage);
  }

  function handleOpenCreateDialog() {
    setSelectedCustomer(null);
    setFormDialogOpen(true);
  }

  function handleOpenEditDialog(customer: Customer) {
    setSelectedCustomer(customer);
    setFormDialogOpen(true);
  }

  function handleFormDialogOpenChange(nextOpen: boolean) {
    setFormDialogOpen(nextOpen);

    if (!nextOpen) {
      setSelectedCustomer(null);
    }
  }

  function handleCustomerFormCompleted() {
    setReloadKey((current) => current + 1);
  }

  function handleRetry() {
    setReloadKey((current) => current + 1);
  }

  const hasSearchConditions =
    Boolean(filters.query) || visibility !== "visible" || Boolean(customerKind);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {isLoading
              ? "顧客情報を読み込んでいます。"
              : pagination
                ? `全${pagination.total_count}件中、${customers.length}件の顧客を表示しています。`
                : `${customers.length}件の顧客を表示しています。`}
          </p>
        </div>

        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={handleOpenCreateDialog}
        >
          <PlusIcon />
          顧客を登録
        </Button>
      </header>

      <section
        className="space-y-4 rounded-lg border bg-card p-4"
        aria-label="顧客一覧の検索とページ操作"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <CustomerSearchForm
            value={queryInput}
            hasAppliedQuery={Boolean(filters.query)}
            visibility={visibility}
            customerKind={customerKind}
            isLoading={isLoading}
            onValueChange={setQueryInput}
            onSearch={handleSearch}
            onClear={handleClearQuery}
            onApplyFilters={handleApplyFilters}
          />

          {!isLoading && !errorMessage && pagination && (
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

        <CustomerActiveFilters
          filters={filters}
          onClearQuery={handleClearQuery}
          onResetVisibility={handleResetVisibility}
          onClearCustomerKind={handleClearCustomerKind}
          onClearAll={handleClearAll}
        />
      </section>

      {formDialogOpen && (
        <CustomerFormDialog
          key={selectedCustomer ? `edit-${selectedCustomer.id}` : "create"}
          open={formDialogOpen}
          mode={formMode}
          customer={selectedCustomer}
          allowVisibilityChange={false}
          onOpenChange={handleFormDialogOpenChange}
          onCompleted={handleCustomerFormCompleted}
        />
      )}

      {isLoading && <CustomerTableSkeleton />}

      {!isLoading && errorMessage && (
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

      {!isLoading && !errorMessage && customers.length === 0 && (
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

      {!isLoading && !errorMessage && customers.length > 0 && (
        <CustomerTable customers={customers} onEdit={handleOpenEditDialog} />
      )}

      {!isLoading && !errorMessage && pagination && (
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
