"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";

import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/staff-auth/hooks/use-auth";
import { ApiClientError } from "@/lib/api/api-client";

import {
  createRfRuleSet,
  fetchRfRuleSet,
  updateRfRuleSet,
} from "../api/rf-management-api";
import { RF_RULE_SET_STATUS_LABELS } from "../constants";
import { useRfRuleSets } from "../hooks/useRfRuleSets";
import type { RfRuleSet } from "../types";
import {
  buildCreateRfRuleSetInput,
  buildUpdateRfRuleSetInput,
  type RfRuleSetBasicValues,
} from "../utils/rf-rule-set-input";
import { RfRuleSetBasicFormDialog } from "./RfRuleSetBasicFormDialog";

type FormMode = "create" | "edit";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function mutationErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return "RFルールを保存できませんでした。";
  }

  if (error.status === 409) {
    return "ほかの担当者によって更新されています。一覧を再読み込みして、もう一度操作してください。";
  }

  return error.errorMessages[0] ?? error.message;
}

export function RfRuleSetsSection() {
  const { staff } = useAuth();
  const isOwner = staff?.staff_master.role_code === "owner";

  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selectedRuleSet, setSelectedRuleSet] = useState<RfRuleSet | null>(
    null,
  );
  const [loadingRuleSetId, setLoadingRuleSetId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const { ruleSets, pagination, isLoading, errorMessage } = useRfRuleSets({
    page: currentPage,
    perPage: 10,
    reloadKey,
  });

  function openCreateForm() {
    setFormMode("create");
    setSelectedRuleSet(null);
    setFormErrorMessage(null);
    setFormOpen(true);
  }

  async function openEditForm(id: number) {
    setLoadingRuleSetId(id);
    setFormErrorMessage(null);

    try {
      const response = await fetchRfRuleSet(id);

      setSelectedRuleSet(response.data.rule_set);
      setFormMode("edit");
      setFormOpen(true);
    } catch (error) {
      setFormErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "RFルールの詳細を取得できませんでした。",
      );
    } finally {
      setLoadingRuleSetId(null);
    }
  }

  async function handleSubmit(values: RfRuleSetBasicValues) {
    setIsSubmitting(true);
    setFormErrorMessage(null);

    try {
      if (formMode === "create") {
        await createRfRuleSet(buildCreateRfRuleSetInput(values));
      } else {
        if (!selectedRuleSet) {
          throw new Error("編集するRFルールが選択されていません。");
        }

        await updateRfRuleSet(
          selectedRuleSet.id,
          buildUpdateRfRuleSetInput(selectedRuleSet, values),
        );
      }

      setFormOpen(false);
      setSelectedRuleSet(null);
      setCurrentPage(1);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setFormErrorMessage(mutationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="rf-rule-sets-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="rf-rule-sets-heading" className="text-lg font-semibold">
            RFルール
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            下書き・公開中・アーカイブ済みのルールを確認します。
          </p>
        </div>

        {isOwner && (
          <Button type="button" onClick={openCreateForm}>
            <PlusIcon />
            新しいルールを作成
          </Button>
        )}
      </div>

      {isLoading ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">RFルール一覧を読み込んでいます。</span>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : errorMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      ) : ruleSets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            RFルールはまだ登録されていません。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ruleSets.map((ruleSet) => (
            <Card key={ruleSet.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{ruleSet.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      バージョン {ruleSet.version}
                    </p>
                  </div>

                  <Badge variant="outline">
                    {RF_RULE_SET_STATUS_LABELS[ruleSet.status]}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <dl className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">全体の集計期間</dt>
                    <dd className="mt-1 font-medium">
                      {ruleSet.aggregation_months}か月
                    </dd>
                  </div>

                  <div>
                    <dt className="text-muted-foreground">来店回数の対象</dt>
                    <dd className="mt-1 font-medium">
                      {ruleSet.frequency_window_months}か月
                    </dd>
                  </div>

                  <div>
                    <dt className="text-muted-foreground">最終更新</dt>
                    <dd className="mt-1 font-medium">
                      {formatDateTime(ruleSet.updated_at)}
                    </dd>
                  </div>
                </dl>

                {isOwner && ruleSet.status === "draft" && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loadingRuleSetId !== null}
                      onClick={() => void openEditForm(ruleSet.id)}
                    >
                      <PencilIcon />
                      {loadingRuleSetId === ruleSet.id
                        ? "読み込み中..."
                        : "基本設定を編集"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {pagination && pagination.total_count > 0 && (
            <Card>
              <CardFooter className="pt-6">
                <PaginationControls
                  className="w-full"
                  currentPage={pagination.current_page}
                  totalPages={pagination.total_pages}
                  totalCount={pagination.total_count}
                  onPageChange={setCurrentPage}
                />
              </CardFooter>
            </Card>
          )}
        </div>
      )}

      {formErrorMessage && !formOpen && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {formErrorMessage}
        </div>
      )}

      <RfRuleSetBasicFormDialog
        open={formOpen}
        mode={formMode}
        ruleSet={selectedRuleSet}
        isSubmitting={isSubmitting}
        errorMessage={formErrorMessage}
        onOpenChange={(open) => {
          if (isSubmitting) return;

          setFormOpen(open);

          if (!open) {
            setSelectedRuleSet(null);
            setFormErrorMessage(null);
          }
        }}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
