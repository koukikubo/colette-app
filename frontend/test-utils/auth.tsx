import { render, type RenderOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthContext } from "@/features/staff-auth/providers/AuthProvider";

// 業務コンポーネントのテストでも、役割を明示してアプリと同じ表示境界を通す。
export function renderWithRole(
  ui: ReactNode,
  role: "owner" | "operator" | "viewer",
  options?: RenderOptions,
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AuthContext.Provider
        value={{
          staff: {
            id: 1,
            login_enabled: true,
            failed_attempts: 0,
            last_logged_in_at: null,
            staff_master: {
              id: 1,
              code: "S1",
              name: "テスト担当者",
              role_code: role,
            },
          },
          status: "authenticated",
          isAuthenticated: true,
          authError: null,
          refreshCurrentStaff: async () => undefined,
          logout: async () => undefined,
        }}
      >
        {children}
      </AuthContext.Provider>
    ),
    ...options,
  });
}
export function renderWithOwner(ui: ReactNode, options?: RenderOptions) {
  return renderWithRole(ui, "owner", options);
}
