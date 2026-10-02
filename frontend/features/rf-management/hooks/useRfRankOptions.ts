"use client";

import { useEffect, useState } from "react";

import { fetchStandardCodes } from "@/features/standard-codes/api/standard-code-api";

import type { RfRankOption } from "../types";

type RfRankOptionsLoadResult = {
  options: RfRankOption[];
  errorMessage: string | null;
};

export function useRfRankOptions() {
  const [loadResult, setLoadResult] = useState<RfRankOptionsLoadResult | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadRfRankOptions() {
      try {
        const response = await fetchStandardCodes(controller.signal);

        if (controller.signal.aborted) return;

        const rfRankMaster = response.data.standard_masters.find(
          (master) => master.system_key === "rf_rank" && master.active,
        );

        if (!rfRankMaster) {
          setLoadResult({
            options: [],
            errorMessage:
              "基本コードマスタに有効なRFランクが登録されていません。",
          });
          return;
        }

        const options = (rfRankMaster.items ?? [])
          .filter((item) => item.active)
          .sort((left, right) => left.position - right.position)
          .map((item) => ({
            id: item.id,
            label: item.label,
          }));

        setLoadResult({
          options,
          errorMessage: null,
        });
      } catch {
        if (controller.signal.aborted) return;

        setLoadResult({
          options: [],
          errorMessage: "RFランクの選択肢を取得できませんでした。",
        });
      }
    }

    void loadRfRankOptions();

    return () => controller.abort();
  }, []);

  return {
    options: loadResult?.options ?? [],
    errorMessage: loadResult?.errorMessage ?? null,
    isLoading: loadResult === null,
  };
}
