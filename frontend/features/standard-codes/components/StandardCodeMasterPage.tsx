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
  fetchStandardCodes,
  fetchStandardListCodes,
} from "@/features/standard-codes/api/standard-code-api";

import type {
  StandardCode,
  StandardListCode,
} from "@/features/standard-codes/types";

import { StandardCodeTable } from "@/features/standard-codes/components/StandardCodeTable";
import { StandardListCodeTable } from "@/features/standard-codes/components/StandardListCodeTable";

/**
 * 有効/無効フィルターの状態。
 *
 * all      : 全件表示
 * active   : 有効のみ表示
 * inactive : 無効のみ表示
 */
type ActiveFilter = "all" | "active" | "inactive";

/**
 * エラーメッセージは文字列を直接あちこちに書かず、
 * 定数にしておくと修正しやすいです。
 */
const STANDARD_CODE_FETCH_ERROR_MESSAGE =
  "基本コード一覧の取得に失敗しました。";

const STANDARD_LIST_CODE_FETCH_ERROR_MESSAGE =
  "選択肢コード一覧の取得に失敗しました。";

export function StandardCodeMasterPage() {
  /**
   * 基本コード一覧。
   *
   * 左ペインに表示する親コードです。
   * 例: 予約ステータス、来店経路、席種など。
   */
  const [standardCodes, setStandardCodes] = useState<StandardCode[]>([]);

  /**
   * 選択肢コード一覧。
   *
   * 右ペインに表示する子コードです。
   * 選択中の基本コードに紐づくデータだけを入れます。
   */
  const [standardListCodes, setStandardListCodes] = useState<
    StandardListCode[]
  >([]);

  /**
   * 現在選択中の基本コード。
   *
   * これが null の場合、右ペインでは
   * 「基本コードを選択してください」と表示します。
   */
  const [selectedStandardCode, setSelectedStandardCode] =
    useState<StandardCode | null>(null);

  /**
   * 基本コード検索キーワード。
   *
   * 左ペインの検索欄に入力された値です。
   */
  const [standardCodeQuery, setStandardCodeQuery] = useState("");

  /**
   * 選択肢コード検索キーワード。
   *
   * 右ペインの検索欄に入力された値です。
   */
  const [standardListCodeQuery, setStandardListCodeQuery] = useState("");

  /**
   * 基本コード側の有効/無効フィルター。
   */
  const [standardCodeActiveFilter, setStandardCodeActiveFilter] =
    useState<ActiveFilter>("all");

  /**
   * 選択肢コード側の有効/無効フィルター。
   */
  const [standardListCodeActiveFilter, setStandardListCodeActiveFilter] =
    useState<ActiveFilter>("all");

  /**
   * 基本コード一覧のローディング状態。
   *
   * 初回表示時はAPI取得前なので true にしておきます。
   * これにより、useEffect の中で即座に setIsLoadingStandardCodes(true)
   * を呼ばずに済みます。
   */
  const [isLoadingStandardCodes, setIsLoadingStandardCodes] = useState(true);

  /**
   * 選択肢コード一覧のローディング状態。
   *
   * 初回は基本コード一覧のローディングで画面全体を見せるため false。
   * 基本コードをクリックして切り替える時だけ true にします。
   */
  const [isLoadingStandardListCodes, setIsLoadingStandardListCodes] =
    useState(false);

  /**
   * 基本コード一覧取得時のエラー。
   */
  const [standardCodeError, setStandardCodeError] = useState<string | null>(
    null,
  );

  /**
   * 選択肢コード一覧取得時のエラー。
   */
  const [standardListCodeError, setStandardListCodeError] = useState<
    string | null
  >(null);

  /**
   * 選択中の基本コードの code だけを取り出します。
   *
   * selectedStandardCode オブジェクト全体を useCallback / useMemo の依存にすると、
   * 同じ code でもオブジェクト参照が変わっただけで再計算される可能性があります。
   * API取得に必要なのは code だけなので、ここで分離します。
   */
  const selectedStandardCodeCode = selectedStandardCode?.code ?? null;

  /**
   * 初回表示時のデータ取得。
   *
   * ここでやること:
   * 1. 基本コード一覧を取得する
   * 2. 先頭の基本コードを選択状態にする
   * 3. 先頭の基本コードに紐づく選択肢コードも取得する
   *
   * 注意:
   * useEffect の中で setLoading(true) のような同期的な setState を呼ぶと、
   * React lint の set-state-in-effect に引っかかりやすくなります。
   * そのため、初回の loading は useState(true) の初期値で表現しています。
   */
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

        /**
         * 基本コードが1件以上ある場合だけ、
         * 先頭の基本コードに紐づく選択肢コードを取得します。
         */
        if (firstCode) {
          try {
            const standardListCodeResponse = await fetchStandardListCodes(
              firstCode.code,
            );

            if (ignored) return;

            listCodes = standardListCodeResponse.data.standard_list_masters;
          } catch (error) {
            if (ignored) return;

            console.error(error);
            listCodeError = STANDARD_LIST_CODE_FETCH_ERROR_MESSAGE;
          }
        }

        /**
         * API取得後にまとめて state を更新します。
         *
         * この setState は await の後に実行されるため、
         * 「Effect内で即座に同期 setState する」形を避けられます。
         */
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

    /**
     * cleanup。
     *
     * 画面を離れた後や、Effectが破棄された後にAPIレスポンスが返ってきても、
     * 古い通信結果で state を更新しないようにします。
     */
    return () => {
      ignored = true;
    };
  }, []);

  /**
   * 選択肢コード一覧を再取得する関数。
   *
   * 基本コードをクリックした時、
   * または右ペインの「再取得」ボタンを押した時に使います。
   *
   * この関数自体は useEffect から自動実行しません。
   * ユーザー操作から呼ぶことで、処理の流れをわかりやすくしています。
   */
  const loadStandardListCodes = useCallback(async (standardCode: string) => {
    try {
      const response = await fetchStandardListCodes(standardCode);

      const listCodes = response.data.standard_list_masters;

      setStandardListCodes(listCodes);
    } catch (error) {
      console.error(error);
      setStandardListCodeError(STANDARD_LIST_CODE_FETCH_ERROR_MESSAGE);
    } finally {
      setIsLoadingStandardListCodes(false);
    }
  }, []);

  /**
   * 基本コード一覧を再取得する関数。
   *
   * 左ペインの「再取得」ボタンで使います。
   * これはユーザー操作から呼ばれるため、
   * 先頭で setIsLoadingStandardCodes(true) してOKです。
   */
  const handleReloadStandardCodes = useCallback(async () => {
    setIsLoadingStandardCodes(true);
    setStandardCodeError(null);

    try {
      const response = await fetchStandardCodes();

      const codes = response.data.standard_masters;

      /**
       * 再取得前に選択していた基本コードがまだ存在する場合は維持。
       * 存在しない場合は先頭を選択。
       */
      const nextSelectedStandardCode =
        codes.find((code) => code.code === selectedStandardCodeCode) ??
        codes[0] ??
        null;

      setStandardCodes(codes);
      setSelectedStandardCode(nextSelectedStandardCode);

      /**
       * 基本コードが1件もない場合は、右ペインも空にします。
       */
      if (!nextSelectedStandardCode) {
        setStandardListCodes([]);
        setStandardListCodeError(null);
        setIsLoadingStandardListCodes(false);
        return;
      }

      /**
       * 選択対象が変わった場合は、右ペインも再取得します。
       */
      setStandardListCodes([]);
      setStandardListCodeError(null);
      setIsLoadingStandardListCodes(true);

      void loadStandardListCodes(nextSelectedStandardCode.code);
    } catch (error) {
      console.error(error);
      setStandardCodeError(STANDARD_CODE_FETCH_ERROR_MESSAGE);
    } finally {
      setIsLoadingStandardCodes(false);
    }
  }, [selectedStandardCodeCode, loadStandardListCodes]);

  /**
   * 基本コードをクリックした時の処理。
   *
   * ここでやること:
   * 1. 選択中の基本コードを更新
   * 2. 右ペインの古い選択肢コードを一旦クリア
   * 3. 右ペインの検索キーワードもクリア
   * 4. 選択肢コード一覧を取得
   */
  const handleSelectStandardCode = useCallback(
    (standardCode: StandardCode) => {
      if (standardCode.code === selectedStandardCodeCode) return;

      setSelectedStandardCode(standardCode);
      setStandardListCodes([]);
      setStandardListCodeError(null);
      setStandardListCodeQuery("");
      setIsLoadingStandardListCodes(true);

      void loadStandardListCodes(standardCode.code);
    },
    [selectedStandardCodeCode, loadStandardListCodes],
  );

  /**
   * 選択肢コード一覧を再取得する処理。
   *
   * 右ペインの「再取得」ボタンで使います。
   */
  const handleReloadStandardListCodes = useCallback(() => {
    if (!selectedStandardCodeCode) return;

    setIsLoadingStandardListCodes(true);
    setStandardListCodeError(null);

    void loadStandardListCodes(selectedStandardCodeCode);
  }, [selectedStandardCodeCode, loadStandardListCodes]);

  /**
   * 基本コードの表示用データ。
   *
   * standardCodes 本体はそのまま保持し、
   * 検索・有効/無効フィルターを反映した表示用配列を useMemo で作ります。
   */
  const filteredStandardCodes = useMemo(() => {
    const query = standardCodeQuery.trim().toLowerCase();

    return standardCodes.filter((standardCode) => {
      const matchesQuery =
        standardCode.code.toLowerCase().includes(query) ||
        standardCode.name.toLowerCase().includes(query);

      const matchesActive =
        standardCodeActiveFilter === "all" ||
        (standardCodeActiveFilter === "active" && standardCode.active) ||
        (standardCodeActiveFilter === "inactive" && !standardCode.active);

      return matchesQuery && matchesActive;
    });
  }, [standardCodes, standardCodeQuery, standardCodeActiveFilter]);

  /**
   * 選択肢コードの表示用データ。
   *
   * 注意:
   * StandardListCode は name ではなく label を持つ前提です。
   * そのため検索対象は standardListCode.label にしています。
   */
  const filteredStandardListCodes = useMemo(() => {
    const query = standardListCodeQuery.trim().toLowerCase();

    return standardListCodes.filter((standardListCode) => {
      const matchesQuery =
        standardListCode.code.toLowerCase().includes(query) ||
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

              <Button size="sm">
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
                <p className="text-destructive text-sm">{standardCodeError}</p>

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

              <Button size="sm" disabled={!selectedStandardCode}>
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
                  onClick={handleReloadStandardListCodes}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  再取得
                </Button>
              </div>
            ) : (
              <StandardListCodeTable
                standardListCodes={filteredStandardListCodes}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
