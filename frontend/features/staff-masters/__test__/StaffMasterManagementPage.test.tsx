import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StaffMasterManagementPage } from "../components/management/StaffMasterManagementPage";

const mocks = vi.hoisted(() => ({
  fetchStaffMasters: vi.fn(),
}));

vi.mock("../api/staff-master-api", () => ({
  fetchStaffMasters: mocks.fetchStaffMasters,
}));

describe("StaffMasterManagementPage", () => {
  it("在籍中一覧には、退職していない担当者だけを表示する", async () => {
    mocks.fetchStaffMasters.mockResolvedValue({
      status: "success",
      data: {
        staff_masters: [
          {
            id: 1,
            code: "00001",
            name: "店主",
            role_code: "owner",
            employment_started_on: "2024-01-01",
            retired_on: null,
            memo: null,
            active: true,
            staff: {
              id: 1,
              login_enabled: true,
              failed_attempts: 0,
              last_logged_in_at: null,
              locked: false,
              locked_at: null,
            },
          },
          {
            id: 2,
            code: "00002",
            name: "退職者",
            role_code: "operator",
            employment_started_on: "2024-01-01",
            retired_on: "2025-12-31",
            memo: null,
            active: false,
            staff: null,
          },
        ],
      },
    });

    render(<StaffMasterManagementPage />);

    expect(await screen.findByText("店主")).toBeInTheDocument();
    expect(screen.queryByText("退職者")).not.toBeInTheDocument();

    expect(mocks.fetchStaffMasters).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "退職者リスト 1名" }),
    ).toBeInTheDocument();
  });
});
