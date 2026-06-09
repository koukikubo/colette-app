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
  code: string;
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
export function updateStandardCode(
  code: string,
  values: StandardCodeFormValues,
) {
  return apiFetch<StandardCodeResponse>(`/api/v1/standard_masters/${code}`, {
    method: "PATCH",
    body: {
      standard_master: values,
    },
  });
}

// 選択肢コード一覧の取得
export function fetchStandardListCodes(StandardCode: string) {
  return apiFetch<StandardListCodesResponse>(
    `/api/v1/standard_masters/${StandardCode}/items`,
  );
}

// 選択肢コードの詳細取得
export function createStandardListCode(
  StandardCode: string,
  values: StandardListCodeFormValues,
) {
  return apiFetch<StandardListCodeResponse>(
    `/api/v1/standard_masters/${StandardCode}/items`,
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
  StandardCode: string,
  id: number,
  values: StandardListCodeFormValues,
) {
  return apiFetch<StandardListCodeResponse>(
    `/api/v1/standard_masters/${StandardCode}/items/${id}`,
    {
      method: "PATCH",
      body: {
        standard_list_master: values,
      },
    },
  );
}

// 次の基本コード候補の取得
export function fetchNextStandardCode() {
  return apiFetch<NextStandardCodeResponse>(
    "/api/v1/standard_masters/next_code",
  );
}
