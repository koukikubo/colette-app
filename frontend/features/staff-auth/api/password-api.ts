import { apiFetch, type ApiSuccessResponse } from "@/lib/api/api-client";
import type { StaffMasterResponse } from "@/features/staff-masters/types";
export type PasswordInput = {
  current_password: string;
  password: string;
  password_confirmation: string;
};
export function changePassword(input: PasswordInput) {
  return apiFetch<ApiSuccessResponse<{ message: string }>>(
    "/api/v1/staff/password",
    { method: "PATCH", body: { staff: input } },
  );
}
export function resetPassword(
  id: number,
  lockVersion: number,
  input: PasswordInput,
) {
  return apiFetch<StaffMasterResponse>(
    "/api/v1/staff_masters/" + id + "/password",
    {
      method: "PATCH",
      body: { staff_master: { lock_version: lockVersion }, staff: input },
    },
  );
}
