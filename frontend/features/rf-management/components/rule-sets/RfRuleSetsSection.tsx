"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PaginationControls } from "@/components/common/pagination/PaginationControls";
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
  archiveRfRuleSet,
  deleteRfRuleSet,
} from "../../api/rf-management-api";

import { useRfRuleSets } from "../../hooks/useRfRuleSets";
import type { RfRuleSet, RfRuleSetStatus } from "../../types";
import {
  buildCreateRfRuleSetInput,
  buildUpdateRfRuleSetInput,
  type RfRuleSetBasicValues,
} from "../../utils/rf-rule-set-input";
import { RfRuleSetStatusBadge } from "../status/RfStatusBadge";
import { RfRuleSetBasicFormDialog } from "./RfRuleSetBasicFormDialog";

import {
  ArchiveIcon,
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { RfRuleSetArchiveDialog } from "./RfRuleSetArchiveDialog";
import { RfRuleSetDeleteDialog } from "./RfRuleSetDeleteDialog";
import { RfRuleSetDetailDialog } from "./RfRuleSetDetailDialog";
import { RfHelpTooltip } from "./RfHelpTooltip";

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

type RfRuleSetsSectionProps = {
  onSettingsChanged?: () => void;
};

export function RfRuleSetsSection({
  onSettingsChanged,
}: RfRuleSetsSectionProps) {
  const router = useRouter();
  const { staff } = useAuth();
  const isOwner = staff?.staff_master.role_code === "owner";

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] =
    useState<RfRuleSetStatus>("draft");
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selectedRuleSet, setSelectedRuleSet] = useState<RfRuleSet | null>(
    null,
  );
  const [loadingRuleSetId, setLoadingRuleSetId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRuleSet, setDetailRuleSet] = useState<RfRuleSet | null>(null);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(
    null,
  );

  const { ruleSets, pagination, isLoading, errorMessage } = useRfRuleSets({
    page: currentPage,
    perPage: 10,
    reloadKey,
    status: selectedStatus,
  });

  const [archiveTarget, setArchiveTarget] = useState<RfRuleSet | null>(null);

  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveErrorMessage, setArchiveErrorMessage] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<RfRuleSet | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );

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

  async function openArchiveDialog(id: number) {
    setArchiveErrorMessage(null);

    setLoadingRuleSetId(id);

    try {
      const response = await fetchRfRuleSet(id);

      // 確認画面で利用者が確認した時点のバージョンを保持する。
      setArchiveTarget(response.data.rule_set);
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

  async function openDeleteDialog(id: number) {
    setDeleteErrorMessage(null);

    setLoadingRuleSetId(id);

    try {
      const response = await fetchRfRuleSet(id);

      // 確認後に別の担当者の変更を誤って削除しないよう、取得時のバージョンを保持する。
      setDeleteTarget(response.data.rule_set);
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

  async function openDetailDialog(id: number) {
    setDetailOpen(true);
    setDetailRuleSet(null);
    setDetailErrorMessage(null);
    setLoadingRuleSetId(id);

    try {
      const response = await fetchRfRuleSet(id);

      setDetailRuleSet(response.data.rule_set);
    } catch (error) {
      setDetailErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "RFルールの設定内容を取得できませんでした。",
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
        const response = await createRfRuleSet(
          buildCreateRfRuleSetInput(values),
        );

        setFormOpen(false);
        setSelectedRuleSet(null);

        router.push(`/rf-management/${response.data.rule_set.id}/edit`);
        return;
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

  async function handleArchive() {
    if (!archiveTarget) return;

    setIsArchiving(true);
    setArchiveErrorMessage(null);

    try {
      await archiveRfRuleSet(archiveTarget.id, archiveTarget.lock_version);

      setArchiveTarget(null);
      setCurrentPage(1);
      setReloadKey((current) => current + 1);
      onSettingsChanged?.();
    } catch (error) {
      setArchiveErrorMessage(
        error instanceof ApiClientError
          ? (error.errorMessages[0] ?? error.message)
          : "RFルールをアーカイブできませんでした。",
      );
    } finally {
      setIsArchiving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      await deleteRfRuleSet(deleteTarget.id, deleteTarget.lock_version);

      setDeleteTarget(null);
      setCurrentPage(1);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof ApiClientError
          ? (error.errorMessages[0] ?? error.message)
          : "RFルールを削除できませんでした。",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDuplicate(id: number) {
    setLoadingRuleSetId(id);
    setFormErrorMessage(null);

    try {
      const response = await fetchRfRuleSet(id);
      const source = response.data.rule_set;
      const recencyCodes = new Map(
        source.recency_rules.map((rule) => [rule.id, rule.code]),
      );
      const frequencyCodes = new Map(
        source.frequency_rules.map((rule) => [rule.id, rule.code]),
      );

      const created = await createRfRuleSet({
        name: `${source.name}（コピー）`,
        aggregation_months: source.aggregation_months,
        frequency_window_months: source.frequency_window_months,
        recency_rules: source.recency_rules.map(
          ({ code, label, min_days, max_days, position }) => ({
            code,
            label,
            min_days,
            max_days,
            position,
          }),
        ),
        frequency_rules: source.frequency_rules.map(
          ({ code, label, min_visits, max_visits, position }) => ({
            code,
            label,
            min_visits,
            max_visits,
            position,
          }),
        ),
        rank_mappings: source.rank_mappings.flatMap((mapping) => {
          const recencyCode = recencyCodes.get(mapping.recency_rule_id);
          const frequencyCode = frequencyCodes.get(mapping.frequency_rule_id);

          return recencyCode && frequencyCode
            ? [
                {
                  recency_code: recencyCode,
                  frequency_code: frequencyCode,
                  rf_rank_id: mapping.rf_rank.id,
                },
              ]
            : [];
        }),
      });

      router.push(`/rf-management/${created.data.rule_set.id}/edit`);
    } catch (error) {
      setFormErrorMessage(mutationErrorMessage(error));
    } finally {
      setLoadingRuleSetId(null);
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
            用途ごとに状態を切り替えて、RFルールを管理します。
          </p>
        </div>

        {isOwner && (
          <Button type="button" onClick={openCreateForm}>
            <PlusIcon />
            新しいルールを作成
          </Button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="RFルールの状態"
        className="mb-4 inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1"
      >
        {(
          [
            ["draft", "下書き"],
            ["published", "公開中"],
            ["archived", "アーカイブ"],
          ] as const
        ).map(([status, label]) => (
          <div key={status} className="flex items-center">
            <Button
              type="button"
              role="tab"
              size="sm"
              variant={selectedStatus === status ? "default" : "ghost"}
              aria-selected={selectedStatus === status}
              onClick={() => {
                setSelectedStatus(status);
                setCurrentPage(1);
              }}
            >
              {label}
            </Button>
            {status === "archived" && (
              <RfHelpTooltip label="アーカイブ">
                過去のRFルールを履歴として残す状態です。計算や編集には使用せず、必要な場合は下書きとして複製します。
              </RfHelpTooltip>
            )}
          </div>
        ))}
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
            {selectedStatus === "draft"
              ? "下書きのRFルールはありません。"
              : selectedStatus === "published"
                ? "公開中のRFルールはありません。"
                : "アーカイブ済みのRFルールはありません。"}
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

                  <RfRuleSetStatusBadge status={ruleSet.status} />
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

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {ruleSet.status !== "draft" && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loadingRuleSetId !== null}
                      onClick={() => void openDetailDialog(ruleSet.id)}
                    >
                      <EyeIcon />
                      {loadingRuleSetId === ruleSet.id
                        ? "読み込み中..."
                        : "設定内容を見る"}
                    </Button>
                  )}

                  {isOwner && (
                    <>
                      {ruleSet.status === "draft" && (
                        <>
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

                          <Button asChild>
                            <Link href={`/rf-management/${ruleSet.id}/edit`}>
                              条件と対応表を設定
                            </Link>
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            disabled={loadingRuleSetId !== null || isDeleting}
                            onClick={() => void openDeleteDialog(ruleSet.id)}
                          >
                            <Trash2Icon />
                            削除
                          </Button>
                        </>
                      )}

                      {ruleSet.status === "published" && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={loadingRuleSetId !== null || isArchiving}
                          onClick={() => void openArchiveDialog(ruleSet.id)}
                        >
                          <ArchiveIcon />
                          アーカイブ
                        </Button>
                      )}

                      {ruleSet.status === "archived" && (
                        <Button
                          type="button"
                          disabled={loadingRuleSetId !== null}
                          onClick={() => void handleDuplicate(ruleSet.id)}
                        >
                          <CopyIcon />
                          {loadingRuleSetId === ruleSet.id
                            ? "複製中..."
                            : "下書きとして複製"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
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

      <RfRuleSetArchiveDialog
        open={archiveTarget !== null}
        ruleSetName={archiveTarget?.name ?? ""}
        isSubmitting={isArchiving}
        errorMessage={archiveErrorMessage}
        onOpenChange={(open) => {
          if (open) return;

          setArchiveTarget(null);
          setArchiveErrorMessage(null);
        }}
        onConfirm={() => void handleArchive()}
      />

      <RfRuleSetDeleteDialog
        open={deleteTarget !== null}
        ruleSetName={deleteTarget?.name ?? ""}
        isSubmitting={isDeleting}
        errorMessage={deleteErrorMessage}
        onOpenChange={(open) => {
          if (open) return;

          setDeleteTarget(null);
          setDeleteErrorMessage(null);
        }}
        onConfirm={() => void handleDelete()}
      />

      <RfRuleSetDetailDialog
        open={detailOpen}
        ruleSet={detailRuleSet}
        isLoading={detailOpen && loadingRuleSetId !== null}
        errorMessage={detailErrorMessage}
        onOpenChange={(open) => {
          setDetailOpen(open);

          if (!open) {
            setDetailRuleSet(null);
            setDetailErrorMessage(null);
          }
        }}
      />
    </section>
  );
}
