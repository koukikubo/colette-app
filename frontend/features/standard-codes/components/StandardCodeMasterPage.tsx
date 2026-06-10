"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  createStandardCode,
  createStandardListCode,
  fetchStandardCodes,
  fetchStandardListCodes,
  updateStandardCode,
  updateStandardListCode,
} from "@/features/standard-codes/api/standard-code-api";

import type {
  StandardCode,
  StandardCodeFormValues,
  StandardListCode,
  StandardListCodeFormValues,
} from "@/features/standard-codes/types";

import { StandardCodeTable } from "@/features/standard-codes/components/StandardCodeTable";
import { StandardListCodeTable } from "@/features/standard-codes/components/StandardListCodeTable";
import { StandardCodeFormDialog } from "@/features/standard-codes/components/StandardCodeFormDialog";
import { StandardListCodeFormDialog } from "./StandardListCodeFormDialog";

type ActiveFilter = "all" | "active" | "inactive";
type DialogMode = "create" | "edit";

const STANDARD_CODE_FETCH_ERROR_MESSAGE =
  "基本コード一覧の取得に失敗しました。";

const STANDARD_LIST_CODE_FETCH_ERROR_MESSAGE =
  "選択肢コード一覧の取得に失敗しました。";

export function StandardCodeMasterPage() {
  const [standardCodes, setStandardCodes] = useState<StandardCode[]>([]);
  const [standardListCodes, setStandardListCodes] = useState<
    StandardListCode[]
  >([]);

  const [selectedStandardCode, setSelectedStandardCode] =
    useState<StandardCode | null>(null);

  const [standardCodeQuery, setStandardCodeQuery] = useState("");
  const [standardListCodeQuery, setStandardListCodeQuery] = useState("");

  const [standardCodeActiveFilter, setStandardCodeActiveFilter] =
    useState<ActiveFilter>("all");
  const [standardListCodeActiveFilter, setStandardListCodeActiveFilter] =
    useState<ActiveFilter>("all");

  const [isLoadingStandardCodes, setIsLoadingStandardCodes] = useState(true);
  const [isLoadingStandardListCodes, setIsLoadingStandardListCodes] =
    useState(false);

  const [standardCodeError, setStandardCodeError] = useState<string | null>(
    null,
  );
  const [standardListCodeError, setStandardListCodeError] = useState<
    string | null
  >(null);

  const selectedStandardCodeId = selectedStandardCode?.id ?? null;

  // 変更点: 基本コードの登録・編集モーダル用state
  const [standardCodeDialogOpen, setStandardCodeDialogOpen] = useState(false);
  const [standardCodeDialogMode, setStandardCodeDialogMode] =
    useState<DialogMode>("create");

  // 変更点: 選択肢コードの登録・編集モーダル用state
  const [standardListCodeDialogOpen, setStandardListCodeDialogOpen] =
    useState(false);

  const [standardListCodeDialogMode, setStandardListCodeDialogMode] =
    useState<DialogMode>("create");

  const [editingStandardListCode, setEditingStandardListCode] =
    useState<StandardListCode | null>(null);

  const [editingStandardCode, setEditingStandardCode] =
    useState<StandardCode | null>(null);

  // 変更点: 登録・更新・無効化の送信中状態を共通管理
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let ignored = false;

    async function loadInitialData() {
      try {
        const standardCodeResponse = await fetchStandardCodes();

        if (ignored) return;

        const codes = standardCodeResponse.data.standard_masters;
        const firstCode = codes[0] ?? null;

        let listCodes: StandardListCode[] = [];
        let listCodeError: string | null = null;

        if (firstCode) {
          try {
            const standardListCodeResponse = await fetchStandardListCodes(
              firstCode.id,
            );

            if (ignored) return;

            listCodes = standardListCodeResponse.data.standard_list_masters;
          } catch (error) {
            if (ignored) return;

            console.error(error);
            listCodeError = STANDARD_LIST_CODE_FETCH_ERROR_MESSAGE;
          }
        }

        setStandardCodes(codes);
        setSelectedStandardCode(firstCode);
        setStandardListCodes(listCodes);
        setStandardListCodeError(listCodeError);
      } catch (error) {
        if (ignored) return;

        console.error(error);
        setStandardCodeError(STANDARD_CODE_FETCH_ERROR_MESSAGE);
      } finally {
        if (ignored) return;

        setIsLoadingStandardCodes(false);
        setIsLoadingStandardListCodes(false);
      }
    }

    void loadInitialData();

    return () => {
      ignored = true;
    };
  }, []);

  const loadStandardListCodes = useCallback(
    async (standardMasterId: number) => {
      try {
        const response = await fetchStandardListCodes(standardMasterId);

        const listCodes = response.data.standard_list_masters;

        setStandardListCodes(listCodes);
      } catch (error) {
        console.error(error);
        setStandardListCodeError(STANDARD_LIST_CODE_FETCH_ERROR_MESSAGE);
      } finally {
        setIsLoadingStandardListCodes(false);
      }
    },
    [],
  );

  const handleReloadStandardCodes = useCallback(async () => {
    if (!selectedStandardCodeId) return;

    setIsLoadingStandardCodes(true);
    setStandardCodeError(null);

    try {
      const response = await fetchStandardCodes();

      const codes = response.data.standard_masters;

      const nextSelectedStandardCode =
        codes.find((code) => code.id === selectedStandardCodeId) ??
        codes[0] ??
        null;

      setStandardCodes(codes);
      setSelectedStandardCode(nextSelectedStandardCode);

      if (!nextSelectedStandardCode) {
        setStandardListCodes([]);
        setStandardListCodeError(null);
        setIsLoadingStandardListCodes(false);
        return;
      }

      setStandardListCodes([]);
      setStandardListCodeError(null);
      setIsLoadingStandardListCodes(true);

      await loadStandardListCodes(nextSelectedStandardCode.id);
    } catch (error) {
      console.error(error);
      setStandardCodeError(STANDARD_CODE_FETCH_ERROR_MESSAGE);
    } finally {
      setIsLoadingStandardCodes(false);
    }
  }, [selectedStandardCodeId, loadStandardListCodes]);

  const handleSelectStandardCode = useCallback(
    (standardCode: StandardCode) => {
      if (standardCode.id === selectedStandardCodeId) return;

      setSelectedStandardCode(standardCode);
      setStandardListCodes([]);
      setStandardListCodeError(null);
      setStandardListCodeQuery("");
      setIsLoadingStandardListCodes(true);

      void loadStandardListCodes(standardCode.id);
    },
    [selectedStandardCodeId, loadStandardListCodes],
  );

  // 変更点: asyncに変更
  // 理由: 登録・編集・無効化後に再取得完了を待てるようにするため
  const handleReloadStandardListCodes = useCallback(async () => {
    if (!selectedStandardCodeId) return;

    setIsLoadingStandardListCodes(true);
    setStandardListCodeError(null);

    await loadStandardListCodes(selectedStandardCodeId);
  }, [selectedStandardCodeId, loadStandardListCodes]);

  // 変更点: ここから下にCRUD用handlerを移動
  // 理由: handleReloadStandardCodes / handleReloadStandardListCodes を参照するため、
  // 先に再取得関数を定義してからCRUD handlerを定義する

  const openCreateStandardCodeDialog = useCallback(() => {
    setEditingStandardCode(null);
    setStandardCodeDialogMode("create");
    setStandardCodeDialogOpen(true);
  }, []);

  const openEditStandardCodeDialog = useCallback(
    (standardCode: StandardCode) => {
      setEditingStandardCode(standardCode);
      setStandardCodeDialogMode("edit");
      setStandardCodeDialogOpen(true);
    },
    [],
  );

  const openCreateStandardListCodeDialog = useCallback(() => {
    if (!selectedStandardCode) return;

    setEditingStandardListCode(null);
    setStandardListCodeDialogMode("create");
    setStandardListCodeDialogOpen(true);
  }, [selectedStandardCode]);

  const openEditStandardListCodeDialog = useCallback(
    (standardListCode: StandardListCode) => {
      setEditingStandardListCode(standardListCode);
      setStandardListCodeDialogMode("edit");
      setStandardListCodeDialogOpen(true);
    },
    [],
  );

  const handleSubmitStandardCode = useCallback(
    async (values: StandardCodeFormValues) => {
      setIsSubmitting(true);

      try {
        if (standardCodeDialogMode === "create") {
          await createStandardCode(values);
        } else {
          if (!editingStandardCode) return;

          await updateStandardCode(editingStandardCode.id, values);
        }

        setStandardCodeDialogOpen(false);
        setEditingStandardCode(null);

        await handleReloadStandardCodes();
      } finally {
        setIsSubmitting(false);
      }
    },
    [standardCodeDialogMode, editingStandardCode, handleReloadStandardCodes],
  );

  const handleSubmitStandardListCode = useCallback(
    async (values: StandardListCodeFormValues) => {
      if (!selectedStandardCode) return;

      setIsSubmitting(true);

      try {
        if (standardListCodeDialogMode === "create") {
          await createStandardListCode(selectedStandardCode.id, values);
        } else {
          if (!editingStandardListCode) return;

          await updateStandardListCode(
            selectedStandardCode.id,
            editingStandardListCode.id,
            values,
          );
        }

        setStandardListCodeDialogOpen(false);
        setEditingStandardListCode(null);

        // 変更点: awaitを付ける
        // 理由: 保存後の再取得が終わってから送信中状態を解除するため
        await handleReloadStandardListCodes();
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedStandardCode,
      standardListCodeDialogMode,
      editingStandardListCode,
      handleReloadStandardListCodes,
    ],
  );

  const filteredStandardCodes = useMemo(() => {
    const query = standardCodeQuery.trim().toLowerCase();

    return standardCodes.filter((standardCode) => {
      const matchesQuery =
        standardCode.display_code.toLowerCase().includes(query) ||
        standardCode.name.toLowerCase().includes(query);

      const matchesActive =
        standardCodeActiveFilter === "all" ||
        (standardCodeActiveFilter === "active" && standardCode.active) ||
        (standardCodeActiveFilter === "inactive" && !standardCode.active);

      return matchesQuery && matchesActive;
    });
  }, [standardCodes, standardCodeQuery, standardCodeActiveFilter]);

  const filteredStandardListCodes = useMemo(() => {
    const query = standardListCodeQuery.trim().toLowerCase();

    return standardListCodes.filter((standardListCode) => {
      const matchesQuery =
        query === "" ||
        standardListCode.display_code.toLowerCase().includes(query) ||
        standardListCode.label.toLowerCase().includes(query);

      const matchesActive =
        standardListCodeActiveFilter === "all" ||
        (standardListCodeActiveFilter === "active" &&
          standardListCode.active) ||
        (standardListCodeActiveFilter === "inactive" &&
          !standardListCode.active);

      return matchesQuery && matchesActive;
    });
  }, [standardListCodes, standardListCodeQuery, standardListCodeActiveFilter]);

  return (
    // 変更点: Fragmentで囲む
    // 理由: 画面本体の外にDialogを並べて配置するため
    <>
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            基本コード・選択肢コードマスタ
          </h1>
          <p className="text-muted-foreground text-sm">
            予約ステータス、来店経路、席種など、システム内で使用する共通選択肢を管理します。
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <Card className="min-h-160">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>基本コード</CardTitle>
                  <CardDescription>
                    選択肢コードをまとめる親コードです。
                  </CardDescription>
                </div>

                {/* 変更点: 追加ボタンにonClickを接続 */}
                <Button size="sm" onClick={openCreateStandardCodeDialog}>
                  <Plus className="mr-1 h-4 w-4" />
                  追加
                </Button>
              </div>

              <div className="space-y-2">
                <Input
                  value={standardCodeQuery}
                  onChange={(event) => setStandardCodeQuery(event.target.value)}
                  placeholder="コード・名称で検索"
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      standardCodeActiveFilter === "all" ? "default" : "outline"
                    }
                    onClick={() => setStandardCodeActiveFilter("all")}
                  >
                    すべて
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      standardCodeActiveFilter === "active"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setStandardCodeActiveFilter("active")}
                  >
                    有効
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      standardCodeActiveFilter === "inactive"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setStandardCodeActiveFilter("inactive")}
                  >
                    無効
                  </Button>
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-0">
              {isLoadingStandardCodes ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : standardCodeError ? (
                <div className="space-y-3 p-4">
                  <p className="text-destructive text-sm">
                    {standardCodeError}
                  </p>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleReloadStandardCodes()}
                  >
                    <RefreshCw className="mr-1 h-4 w-4" />
                    再取得
                  </Button>
                </div>
              ) : (
                <StandardCodeTable
                  standardCodes={filteredStandardCodes}
                  selectedStandardCode={selectedStandardCode}
                  onSelect={handleSelectStandardCode}
                  // 変更点: 編集ボタン用handlerを渡す
                  onEdit={openEditStandardCodeDialog}
                />
              )}
            </CardContent>
          </Card>

          <Card className="min-h-160">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>選択肢コード</CardTitle>
                  <CardDescription>
                    {selectedStandardCode
                      ? `${selectedStandardCode.name} に紐づく選択肢を管理します。`
                      : "左の基本コードを選択してください。"}
                  </CardDescription>
                </div>

                {/* 変更点: 選択肢コード追加ボタンにonClickを接続 */}
                <Button
                  size="sm"
                  disabled={!selectedStandardCode}
                  onClick={openCreateStandardListCodeDialog}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  追加
                </Button>
              </div>

              <div className="space-y-2">
                <Input
                  value={standardListCodeQuery}
                  onChange={(event) =>
                    setStandardListCodeQuery(event.target.value)
                  }
                  placeholder="コード・名称で検索"
                  disabled={!selectedStandardCode}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      standardListCodeActiveFilter === "all"
                        ? "default"
                        : "outline"
                    }
                    disabled={!selectedStandardCode}
                    onClick={() => setStandardListCodeActiveFilter("all")}
                  >
                    すべて
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      standardListCodeActiveFilter === "active"
                        ? "default"
                        : "outline"
                    }
                    disabled={!selectedStandardCode}
                    onClick={() => setStandardListCodeActiveFilter("active")}
                  >
                    有効
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      standardListCodeActiveFilter === "inactive"
                        ? "default"
                        : "outline"
                    }
                    disabled={!selectedStandardCode}
                    onClick={() => setStandardListCodeActiveFilter("inactive")}
                  >
                    無効
                  </Button>
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-0">
              {!selectedStandardCode ? (
                <div className="flex min-h-90 items-center justify-center p-6">
                  <p className="text-muted-foreground text-sm">
                    基本コードを選択すると、紐づく選択肢コードが表示されます。
                  </p>
                </div>
              ) : isLoadingStandardListCodes ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : standardListCodeError ? (
                <div className="space-y-3 p-4">
                  <p className="text-destructive text-sm">
                    {standardListCodeError}
                  </p>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleReloadStandardListCodes()}
                  >
                    <RefreshCw className="mr-1 h-4 w-4" />
                    再取得
                  </Button>
                </div>
              ) : (
                <StandardListCodeTable
                  standardListCodes={filteredStandardListCodes}
                  // 変更点: 編集ボタン用handlerを渡す
                  onEdit={openEditStandardListCodeDialog}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 変更点: 基本コードの登録・編集Dialogを接続 */}
      <StandardCodeFormDialog
        open={standardCodeDialogOpen}
        mode={standardCodeDialogMode}
        standardCode={editingStandardCode}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setStandardCodeDialogOpen(open);

          if (!open) {
            setEditingStandardCode(null);
          }
        }}
        onSubmit={handleSubmitStandardCode}
      />

      {/* 変更点: 選択肢コードの登録・編集Dialogを接続 */}
      <StandardListCodeFormDialog
        open={standardListCodeDialogOpen}
        mode={standardListCodeDialogMode}
        selectedStandardCode={selectedStandardCode}
        standardListCode={editingStandardListCode}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setStandardListCodeDialogOpen(open);

          if (!open) {
            setEditingStandardListCode(null);
          }
        }}
        onSubmit={handleSubmitStandardListCode}
      />
    </>
  );
}
