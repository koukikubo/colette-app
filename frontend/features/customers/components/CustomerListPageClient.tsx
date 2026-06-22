"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiClientError } from "@/lib/api/api-client";

import { fetchCustomers } from "../api/customer-api";
import type { Customer, CustomerListParams } from "../types";
import { CustomerTable } from "./CustomerTable";
import { CustomerTableSkeleton } from "./CustomerTableSkeleton";
import { CustomerSearchForm } from "./CustomerSearchForm";
import { CustomerActiveFilters } from "./CustomerActiveFilters";
import { CustomerFilterValues } from "./CustomerFilterPopover";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import {
  CustomerFormDialog,
  type CustomerFormMode,
} from "./CustomerFormDialog";

export function CustomerListPageClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  useEffect(() => {
    let isCancelled = false;

    async function loadCustomers() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchCustomers({
          visibility,
          customer_kind: customerKind,
          query: appliedQuery,
        });

        if (isCancelled) {
          return;
        }

        setCustomers(response.data.customers);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (error instanceof ApiClientError) {
          const details =
            error.errors.length > 0 ? ` ${error.errors.join(" / ")}` : "";

          setErrorMessage(
            `顧客一覧を取得できませんでした。` +
              `（HTTP ${error.status}）` +
              `${error.message}${details}`,
          );

          return;
        }

        setErrorMessage("顧客一覧の取得中に予期しないエラーが発生しました。");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCustomers();

    return () => {
      isCancelled = true;
    };
  }, [visibility, customerKind, appliedQuery, reloadKey]);

  function handleSearch() {
    const normalizedQuery = queryInput.trim();

    setFilters((current) => ({
      ...current,
      query: normalizedQuery.length > 0 ? normalizedQuery : undefined,
    }));
  }

  function handleClearQuery() {
    setQueryInput("");

    setFilters((current) => ({
      ...current,
      query: undefined,
    }));
  }

  function handleApplyFilters(nextFilters: CustomerFilterValues) {
    setFilters((current) => ({
      ...current,
      visibility: nextFilters.visibility,
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
    setQueryInput("");

    setFilters({
      visibility: "visible",
    });
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

  const hasSearchConditions =
    Boolean(filters.query) || visibility !== "visible" || Boolean(customerKind);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">顧客管理</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          登録されている顧客情報を確認できます。
        </p>
      </div>

      <Button type="button" onClick={handleOpenCreateDialog}>
        <PlusIcon />
        顧客を登録
      </Button>

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

      <CustomerActiveFilters
        filters={filters}
        onClearQuery={handleClearQuery}
        onResetVisibility={handleResetVisibility}
        onClearCustomerKind={handleClearCustomerKind}
        onClearAll={handleClearAll}
      />

      {formDialogOpen && (
        <CustomerFormDialog
          key={selectedCustomer ? `edit-${selectedCustomer.id}` : "create"}
          open={formDialogOpen}
          mode={formMode}
          customer={selectedCustomer}
          onOpenChange={handleFormDialogOpenChange}
          onCompleted={handleCustomerFormCompleted}
        />
      )}

      {isLoading && <CustomerTableSkeleton />}

      {!isLoading && errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>顧客一覧を取得できませんでした</AlertTitle>

          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !errorMessage && customers.length === 0 && (
        <div className="rounded-md border border-dashed p-10 text-center">
          <p className="font-medium">
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
    </div>
  );
}
