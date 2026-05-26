import { apiRequest, csrfRequest } from "@/lib/api/api-client";
// 型を定義
export type StaffMaster = {
  id: number;
  code: string;
  name: string;
  role_code: string;
  employment_started_on: string;
  retired_on: string | null;
  memo: string | null;
};

export type Staff = {
  id: number;
  staff_master: StaffMaster;
  login_enabled: boolean;
  failed_attempts: number;
  last_logged_in_at: string | null;
};

export type StaffAuthData = {
  staff: Staff;
};

// スタッフのログイン、ログアウト、現在のスタッフ情報を取得する関数を定義
export async function loginStaff({
  staffId,
  password,
}: {
  staffId: number;
  password: string;
}): Promise<StaffAuthData> {
  return csrfRequest<StaffAuthData>("/api/v1/staff/login", {
    method: "POST",
    body: JSON.stringify({
      staff: {
        staff_id: staffId,
        password,
      },
    }),
  });
}

// スタッフのログアウトを行う関数
export async function logoutStaff(): Promise<{ message: string }> {
  return csrfRequest<{ message: string }>("/api/v1/staff/logout", {
    method: "DELETE",
  });
}

// 現在ログインしているスタッフの情報を取得する関数
export async function fetchCurrentStaff(): Promise<StaffAuthData> {
  return apiRequest<StaffAuthData>("/api/v1/staff/current", {
    method: "GET",
  });
}
