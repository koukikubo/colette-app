"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchStandardCodes,
  updateStandardListCode,
} from "@/features/standard-codes/api/standard-code-api";
import type { StandardListCode } from "@/features/standard-codes/types";
import { useAuth } from "@/features/staff-auth/hooks/use-auth";
import { ApiClientError } from "@/lib/api/api-client";

const FALLBACK_COLOR = "#64748B";

type RfRankColorSettingsSectionProps = {
  onColorsChanged?: () => void;
};

export function RfRankColorSettingsSection({
  onColorsChanged,
}: RfRankColorSettingsSectionProps) {
  const { staff } = useAuth();
  const isOwner = staff?.staff_master.role_code === "owner";
  const [masterId, setMasterId] = useState<number | null>(null);
  const [ranks, setRanks] = useState<StandardListCode[]>([]);
  const [savedColors, setSavedColors] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRanks() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchStandardCodes(controller.signal);
        if (controller.signal.aborted) return;

        const rfRankMaster = response.data.standard_masters.find(
          (master) => master.system_key === "rf_rank" && master.active,
        );

        if (!rfRankMaster) {
          setErrorMessage("有効なRFランクマスタが見つかりませんでした。");
          return;
        }

        const activeRanks = (rfRankMaster.items ?? [])
          .filter((rank) => rank.active)
          .sort((left, right) => left.position - right.position)
          .map((rank) => ({
            ...rank,
            display_color: rank.display_color ?? FALLBACK_COLOR,
          }));

        setMasterId(rfRankMaster.id);
        setRanks(activeRanks);
        setSavedColors(
          Object.fromEntries(
            activeRanks.map((rank) => [rank.id, rank.display_color]),
          ),
        );
      } catch (error) {
        if (controller.signal.aborted) return;

        setErrorMessage(
          error instanceof ApiClientError
            ? error.message
            : "RFランクのカラー設定を取得できませんでした。",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadRanks();

    return () => controller.abort();
  }, []);

  const changedRanks = useMemo(
    () =>
      ranks.filter(
        (rank) =>
          (rank.display_color ?? FALLBACK_COLOR) !== savedColors[rank.id],
      ),
    [ranks, savedColors],
  );

  function changeColor(id: number, color: string) {
    setRanks((current) =>
      current.map((rank) =>
        rank.id === id ? { ...rank, display_color: color.toUpperCase() } : rank,
      ),
    );
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function saveColors() {
    if (masterId === null || changedRanks.length === 0) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await Promise.all(
        changedRanks.map((rank) =>
          updateStandardListCode(masterId, rank.id, {
            display_color: rank.display_color ?? FALLBACK_COLOR,
          }),
        ),
      );

      setSavedColors(
        Object.fromEntries(
          ranks.map((rank) => [rank.id, rank.display_color ?? FALLBACK_COLOR]),
        ),
      );
      setSuccessMessage("RFランクのカラー設定を保存しました。");
      onColorsChanged?.();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "RFランクのカラー設定を保存できませんでした。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-labelledby="rf-rank-color-settings-heading">
      <div className="mb-3">
        <h2
          id="rf-rank-color-settings-heading"
          className="text-lg font-semibold"
        >
          RFランクのカラー設定
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ランク別人数とRFランク対応表で共通して使用する色を設定します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ランクカラー</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div role="status" className="space-y-2">
              <span className="sr-only">カラー設定を読み込んでいます。</span>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : errorMessage && ranks.length === 0 ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {errorMessage}
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {ranks.map((rank) => {
                  const color = rank.display_color ?? FALLBACK_COLOR;

                  return (
                    <div
                      key={rank.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{rank.label}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {color}
                        </p>
                      </div>
                      <input
                        type="color"
                        value={color}
                        disabled={!isOwner || isSaving}
                        aria-label={`${rank.label}の表示色`}
                        className="h-10 w-12 cursor-pointer rounded-md border bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-60"
                        onChange={(event) =>
                          changeColor(rank.id, event.target.value)
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div className="text-sm">
                  {errorMessage && (
                    <p role="alert" className="text-destructive">
                      {errorMessage}
                    </p>
                  )}
                  {successMessage && (
                    <p role="status" className="text-emerald-700">
                      {successMessage}
                    </p>
                  )}
                  {!isOwner && (
                    <p className="text-muted-foreground">
                      カラー設定を変更できるのはownerのみです。
                    </p>
                  )}
                </div>

                {isOwner && (
                  <Button
                    type="button"
                    disabled={changedRanks.length === 0 || isSaving}
                    onClick={() => void saveColors()}
                  >
                    {isSaving ? "保存中..." : "カラー設定を保存"}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
