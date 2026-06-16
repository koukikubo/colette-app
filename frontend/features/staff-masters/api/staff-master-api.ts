import { apiFetch } from "@/lib/api/api-client";

import type {
  CreateStaffMasterRequest,
  RetireStaffMasterRequest,
  StaffMasterListResponse,
  StaffMasterResponse,
  UpdateLoginEnabledRequest,
  UpdateStaffMasterRequest,
} from "../types";

const STAFF_MASTERS_PATH = "/api/v1/staff_masters";

export function fetchStaffMasters() {
  return apiFetch<StaffMasterListResponse>(STAFF_MASTERS_PATH);
}

export function fetchStaffMaster(id: number) {
  return apiFetch<StaffMasterResponse>(`${STAFF_MASTERS_PATH}/${id}`);
}

export function createStaffMaster(payload: CreateStaffMasterRequest) {
  return apiFetch<StaffMasterResponse>(STAFF_MASTERS_PATH, {
    method: "POST",
    body: payload,
  });
}

export function updateStaffMaster(
  id: number,
  payload: UpdateStaffMasterRequest,
) {
  return apiFetch<StaffMasterResponse>(`${STAFF_MASTERS_PATH}/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function retireStaffMaster(
  id: number,
  payload: RetireStaffMasterRequest,
) {
  return apiFetch<StaffMasterResponse>(`/api/v1/staff_masters/${id}/retire`, {
    method: "PATCH",
    body: payload,
  });
}

export function restoreStaffMaster(id: number) {
  return apiFetch<StaffMasterResponse>(`${STAFF_MASTERS_PATH}/${id}/restore`, {
    method: "PATCH",
  });
}

export function updateStaffLoginEnabled(id: number, loginEnabled: boolean) {
  const payload: UpdateLoginEnabledRequest = {
    staff: {
      login_enabled: loginEnabled,
    },
  };

  return apiFetch<StaffMasterResponse>(
    `${STAFF_MASTERS_PATH}/${id}/login_enabled`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function resetStaffFailedAttempts(id: number) {
  return apiFetch<StaffMasterResponse>(
    `${STAFF_MASTERS_PATH}/${id}/reset_failed_attempts`,
    {
      method: "PATCH",
    },
  );
}
