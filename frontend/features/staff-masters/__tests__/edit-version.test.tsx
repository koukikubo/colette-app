import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { StaffMasterEditDialog } from "../components/dialog/StaffMasterEditDialog";
import type { StaffMaster } from "../types";
const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  toggle: vi.fn(),
  reset: vi.fn(),
}));
vi.mock("../api/staff-master-api", () => ({
  updateStaffMaster: mocks.update,
  updateStaffLoginEnabled: mocks.toggle,
  resetStaffFailedAttempts: mocks.reset,
}));
const original: StaffMaster = {
  id: 5,
  lock_version: 0,
  code: "S05",
  name: "担当者",
  role_code: "operator",
  employment_started_on: "2026-01-01",
  retired_on: null,
  memo: null,
  active: true,
  staff: {
    id: 5,
    login_enabled: true,
    failed_attempts: 1,
    last_logged_in_at: null,
    locked: false,
    locked_at: null,
  },
};
const updated = {
  ...original,
  lock_version: 1,
  staff: { ...original.staff!, login_enabled: false },
};
beforeEach(() => {
  mocks.update.mockResolvedValue({ data: { staff_master: updated } });
  mocks.toggle.mockResolvedValue({ data: { staff_master: updated } });
});
function Harness() {
  const [master, setMaster] = useState(original);
  return (
    <StaffMasterEditDialog
      open
      staffMaster={master}
      onOpenChange={() => {}}
      onRetired={async () => {}}
      onUpdated={async () => {
        setMaster(updated);
      }}
    />
  );
}
it("本人のログイン管理操作後は入力を保持して返却された版で保存する", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.type(screen.getByLabelText("メモ"), "入力中のメモ");
  await user.click(
    screen.getByRole("button", { name: "ログインを無効にする" }),
  );
  await user.click(
    screen.getByRole("button", { name: "ログインを無効にする" }),
  );
  await waitFor(() => expect(mocks.toggle).toHaveBeenCalledWith(5, false, 0));
  await waitFor(() =>
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
  );
  expect(screen.getByLabelText("メモ")).toHaveValue("入力中のメモ");
  await user.click(screen.getByRole("button", { name: "確認へ" }));
  await user.click(screen.getByRole("button", { name: "変更を確定" }));
  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith(5, {
      staff_master: expect.objectContaining({
        lock_version: 1,
        memo: "入力中のメモ",
      }),
    }),
  );
});
it("他者の更新でpropsだけ変化しても古い編集の版を自動で進めない", async () => {
  const user = userEvent.setup();
  const props = {
    open: true,
    onOpenChange: () => {},
    onUpdated: async () => {},
    onRetired: async () => {},
  };
  const view = render(
    <StaffMasterEditDialog {...props} staffMaster={original} />,
  );
  await user.type(screen.getByLabelText("メモ"), "古い編集");
  view.rerender(<StaffMasterEditDialog {...props} staffMaster={updated} />);
  await user.click(screen.getByRole("button", { name: "確認へ" }));
  await user.click(screen.getByRole("button", { name: "変更を確定" }));
  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith(5, {
      staff_master: expect.objectContaining({ lock_version: 0 }),
    }),
  );
});
