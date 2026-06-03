import { apiFetch, type ApiSuccessResponse } from "@/lib/api/api-client";

import type {
  StandardCode,
  StandardCodeFormValues,
  StandardListCode,
  StandardListCodeFormValues,
} from "@/features/standard_codes/types";

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

export function fetchStandardCodes() {
  return apiFetch<StandardCodesResponse>("/api/v1/standard_masters");
}

export function createStandardCode(values: StandardCodeFormValues) {
  return apiFetch<StandardCodeResponse>("/api/v1/standard_masters", {
    method: "POST",
    body: {
      standard_master: values,
    },
  });
}

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

export function deleteStandardCode(code: string) {
  return apiFetch<ApiSuccessResponse<null>>(
    `/api/v1/standard_masters/${code}`,
    {
      method: "DELETE",
    },
  );
}

export function fetchStandardListCodes(StandardCode: string) {
  return apiFetch<StandardListCodesResponse>(
    `/api/v1/standard_masters/${StandardCode}/items`,
  );
}

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

export function deleteStandardListCode(StandardCode: string, id: number) {
  return apiFetch<ApiSuccessResponse<null>>(
    `/api/v1/standard_masters/${StandardCode}/items/${id}`,
    {
      method: "DELETE",
    },
  );
}

export function fetchNextStandardCode() {
  return apiFetch<NextStandardCodeResponse>(
    "/api/v1/standard_masters/next_code",
  );
}
