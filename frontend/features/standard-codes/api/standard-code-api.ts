import { apiFetch, type ApiSuccessResponse } from "@/lib/api/api-client";

import type {
  StandardCode,
  StandardCodeFormValues,
  StandardListCode,
  StandardListCodeFormValues,
} from "@/features/standard-codes/types";

type StandardCodesResponse = ApiSuccessResponse<{
  standard_masters: StandardCode[];
}>;

type StandardCodeResponse = ApiSuccessResponse<{
  standard_master: StandardCode;
}>;

type StandardListCodesResponse = ApiSuccessResponse<{
  standard_list_masters: StandardListCode[];
}>;

type StandardListCodeResponse = ApiSuccessResponse<{
  standard_list_master: StandardListCode;
}>;

export type NextStandardCodeResponse = ApiSuccessResponse<{
  id: number;
}>;

// 基本コード一覧の取得
export function fetchStandardCodes() {
  return apiFetch<StandardCodesResponse>("/api/v1/standard_masters");
}

// 基本コードの詳細取得
export function createStandardCode(values: StandardCodeFormValues) {
  return apiFetch<StandardCodeResponse>("/api/v1/standard_masters", {
    method: "POST",
    body: {
      standard_master: values,
    },
  });
}

// 基本コードの更新
export function updateStandardCode(id: number, values: StandardCodeFormValues) {
  return apiFetch<StandardCodeResponse>(`/api/v1/standard_masters/${id}`, {
    method: "PATCH",
    body: {
      standard_master: values,
    },
  });
}

// 選択肢コード一覧の取得
export function fetchStandardListCodes(StandardMasterId: number) {
  return apiFetch<StandardListCodesResponse>(
    `/api/v1/standard_masters/${StandardMasterId}/items`,
  );
}

// 選択肢コードの詳細取得
export function createStandardListCode(
  StandardMasterId: number,
  values: StandardListCodeFormValues,
) {
  return apiFetch<StandardListCodeResponse>(
    `/api/v1/standard_masters/${StandardMasterId}/items`,
    {
      method: "POST",
      body: {
        standard_list_master: values,
      },
    },
  );
}

// 選択肢コードの更新
export function updateStandardListCode(
  StandardMasterId: number,
  id: number,
  values: StandardListCodeFormValues,
) {
  return apiFetch<StandardListCodeResponse>(
    `/api/v1/standard_masters/${StandardMasterId}/items/${id}`,
    {
      method: "PATCH",
      body: {
        standard_list_master: values,
      },
    },
  );
}
