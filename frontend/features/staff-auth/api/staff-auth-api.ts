import { apiFetch } from "@/lib/api/api-client";

import type {
  LoginStaffRequest,
  LogoutResponse,
  StaffAuthResponse,
  StaffLoginOptionsResponse,
} from "../types";

type CsrfResponse = {
  status: "success";
  data: {
    csrf_token: string;
  };
};

async function fetchCsrfToken() {
  const response = await apiFetch<CsrfResponse>("/api/v1/csrf", {
    method: "GET",
  });
  return response.data.csrf_token;
}

// スタッフ認証関連のAPIクライアント関数を定義
export async function loginStaff(payload: LoginStaffRequest) {
  const csrfToken = await fetchCsrfToken();

  return apiFetch<StaffAuthResponse>("/api/v1/staff/login", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    body: payload,
  });
}

// スタッフのログアウトを行うAPIクライアント関数
export async function logoutStaff() {
  const csrfToken = await fetchCsrfToken();

  return apiFetch<LogoutResponse>("/api/v1/staff/logout", {
    method: "DELETE",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  });
}

// 現在ログインしているスタッフの情報を取得するAPIクライアント関数
export function fetchCurrentStaff() {
  return apiFetch<StaffAuthResponse>("/api/v1/staff/current", {
    method: "GET",
  });
}

// ログイン画面に表示する担当者候補を取得する
export function fetchStaffLoginOptions() {
  return apiFetch<StaffLoginOptionsResponse>("/api/v1/staff/login_options");
}
