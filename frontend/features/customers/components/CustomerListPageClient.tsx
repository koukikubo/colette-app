"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiClientError } from "@/lib/api/api-client";

import { fetchCustomers } from "../api/customer-api";
import type { Customer } from "../types";
import { CustomerTable } from "./CustomerTable";
import { CustomerTableSkeleton } from "./CustomerTableSkeleton";
import { CustomerSearchForm } from "./CustomerSearchForm";

export function CustomerListPageClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadCustomers() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchCustomers({
          visibility: "visible",
          query: searchQuery || undefined,
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
  }, [searchQuery]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">顧客管理</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          登録されている顧客情報を確認できます。
        </p>
      </div>

      <CustomerSearchForm
        initialQuery={searchQuery}
        isLoading={isLoading}
        onSearch={setSearchQuery}
      />

      {isLoading && <CustomerTableSkeleton />}

      {!isLoading && errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>顧客一覧を取得できませんでした</AlertTitle>

          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !errorMessage && customers.length === 0 && (
        <div className="rounded-md border border-dashed p-10 text-center">
          <p className="font-medium">顧客が登録されていません</p>

          <p className="mt-1 text-sm text-muted-foreground">
            顧客が登録されると、ここに一覧表示されます。
          </p>
        </div>
      )}

      {!isLoading && !errorMessage && customers.length > 0 && (
        <CustomerTable customers={customers} />
      )}
    </div>
  );
}
