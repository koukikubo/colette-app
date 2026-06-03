import { apiFetch } from "@/lib/api/api-client";

import type {
  LoginStaffRequest,
  LogoutResponse,
  StaffAuthResponse,
} from "../types";

// スタッフ認証関連のAPIクライアント関数を定義
export function loginStaff(payload: LoginStaffRequest) {
  return apiFetch<StaffAuthResponse>("/api/v1/staff/login", {
    method: "POST",
    body: payload,
  });
}

// スタッフのログアウトを行うAPIクライアント関数
export function logoutStaff() {
  return apiFetch<LogoutResponse>("/api/v1/staff/logout", {
    method: "DELETE",
  });
}

// 現在ログインしているスタッフの情報を取得するAPIクライアント関数
export function fetchCurrentStaff() {
  return apiFetch<StaffAuthResponse>("/api/v1/staff/current", {
    method: "GET",
  });
}
