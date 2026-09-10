import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StaffMasterManagementPage } from "../components/management/StaffMasterManagementPage";
import userEvent from "@testing-library/user-event";

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

  it("退職者リストへ切り替えると、退職済みの担当者だけを表示する", async () => {
    const user = userEvent.setup();

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

    await screen.findByText("店主");

    await user.click(screen.getByRole("button", { name: "退職者リスト 1名" }));

    expect(await screen.findByText("退職者")).toBeInTheDocument();
    expect(screen.queryByText("店主")).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "在籍中一覧 1名" }),
    ).toBeInTheDocument();
  });

  it("担当者一覧の取得に失敗すると、エラーと再読み込みボタンを表示する", async () => {
    mocks.fetchStaffMasters.mockRejectedValue(
      new Error("ネットワーク接続に失敗しました"),
    );

    render(<StaffMasterManagementPage />);

    expect(
      await screen.findByText("担当者情報を取得できませんでした。"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "再読み込み" }),
    ).toBeInTheDocument();
  });

  it("再読み込みを押すと、担当者一覧を再取得して表示する", async () => {
    const user = userEvent.setup();
    const errorMessage = "担当者情報を取得できませんでした。";

    mocks.fetchStaffMasters
      .mockRejectedValueOnce(new Error("ネットワーク接続に失敗しました"))
      .mockResolvedValueOnce({
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
          ],
        },
      });

    render(<StaffMasterManagementPage />);

    await screen.findByText(errorMessage);

    await user.click(screen.getByRole("button", { name: "再読み込み" }));

    expect(await screen.findByText("店主")).toBeInTheDocument();
    expect(mocks.fetchStaffMasters).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  it("新規登録を押すと、新規担当者登録ダイアログを表示する", async () => {
    const user = userEvent.setup();

    mocks.fetchStaffMasters.mockResolvedValue({
      status: "success",
      data: {
        staff_masters: [],
      },
    });

    render(<StaffMasterManagementPage />);

    await screen.findByText("在籍中の担当者はいません。");

    await user.click(screen.getByRole("button", { name: "新規登録" }));

    expect(await screen.findByText("新規担当者登録")).toBeInTheDocument();
    expect(
      screen.getByText("担当者の基本情報とログイン情報を登録します。"),
    ).toBeInTheDocument();
  });
});
