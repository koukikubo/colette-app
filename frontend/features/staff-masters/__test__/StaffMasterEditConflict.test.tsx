import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { StaffMasterEditDialog } from "../components/dialog/StaffMasterEditDialog";
import type { StaffMaster } from "../types";
import { ApiClientError } from "@/lib/api/api-client";

const mocks = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("../api/staff-master-api", () => ({ updateStaffMaster: mocks.update }));

it("編集中の一覧更新で版を上書きせず、409の理由と入力を残す", async () => {
  mocks.update.mockRejectedValue(
    new ApiClientError("別の担当者が更新しました", 409, [
      "一覧を更新してください",
    ]),
  );
  const user = userEvent.setup();
  const master: StaffMaster = {
    id: 3,
    lock_version: 0,
    code: "S03",
    name: "元の名前",
    role_code: "operator",
    employment_started_on: "2026-01-01",
    retired_on: null,
    memo: null,
    active: true,
    staff: null,
  };
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    onUpdated: vi.fn(),
    onRetired: vi.fn(),
  };
  const { rerender } = render(
    <StaffMasterEditDialog {...props} staffMaster={master} />,
  );
  const input = screen.getByLabelText(/担当者名/);
  await user.clear(input);
  await user.type(input, "自分の入力");
  rerender(
    <StaffMasterEditDialog
      {...props}
      staffMaster={{ ...master, lock_version: 1, name: "他者の変更" }}
    />,
  );
  await user.click(screen.getByRole("button", { name: "確認へ" }));
  await user.click(screen.getByRole("button", { name: "変更を確定" }));
  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        staff_master: expect.objectContaining({
          lock_version: 0,
          name: "自分の入力",
        }),
      }),
    ),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "別の担当者が更新しました",
  );
  expect(screen.getByLabelText(/担当者名/)).toHaveValue("自分の入力");
  expect(props.onUpdated).not.toHaveBeenCalled();
}, 15_000);
