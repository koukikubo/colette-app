import { apiFetch, type ApiSuccessResponse } from "@/lib/api/api-client";
export const GUIDE_VERSION = 1;
export type GuideState = {
  guide_version: number;
  status: "unseen" | "completed" | "skipped";
  updated_at: string | null;
};
export function fetchGuideState(signal?: AbortSignal) {
  return apiFetch<ApiSuccessResponse<{ guide_state: GuideState }>>(
    "/api/v1/staff/guide_state",
    { cache: "no-store", signal },
  );
}
export function saveGuideState(status: "completed" | "skipped") {
  return apiFetch<ApiSuccessResponse<{ guide_state: GuideState }>>(
    "/api/v1/staff/guide_state",
    {
      method: "PATCH",
      body: { guide_state: { guide_version: GUIDE_VERSION, status } },
    },
  );
}
